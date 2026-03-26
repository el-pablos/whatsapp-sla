/**
 * WhatsApp Connection Manager
 *
 * Mengorkestrasi semua komponen Baileys:
 * - Session management
 * - Socket initialization
 * - QR & Pairing handling
 * - Reconnect logic
 * - Event handling
 */

import { EventEmitter } from "events";
import type { WASocket } from "@whiskeysockets/baileys";
import pino from "pino";

import {
  initializeSocket,
  getBaileysVersion,
  requestPairingCode,
  disconnectSocket,
} from "../socket";
import {
  SessionStore,
  createSessionStore,
  DEFAULT_SESSION_BASE_PATH,
} from "../auth/session-store";
import { QRHandler } from "../auth/qr-handler";
import { PairingHandler } from "../auth/pairing-handler";
import { ReconnectHandler } from "../handlers/reconnect";
import { BaileysEventEmitter } from "../handlers/events";
import { loadConfig } from "../config";
import type { SocketConfig, BaileysVersionInfo } from "../types";

/**
 * Connection Manager configuration
 */
export interface ConnectionManagerConfig {
  sessionId: string;
  sessionBasePath?: string;
  redisUrl?: string;
  enableQR?: boolean;
  enablePairing?: boolean;
  reconnectOptions?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
  qrOptions?: {
    timeout?: number;
    maxRetries?: number;
  };
  logger?: any;
}

/**
 * Connection status
 */
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "authenticating"
  | "reconnecting"
  | "failed";

/**
 * Connection Manager events
 */
export interface ConnectionManagerEvents {
  "connection:status": (status: ConnectionStatus) => void;
  "connection:qr": (qr: string, attempt: number) => void;
  "connection:pairing": (
    code: string,
    phoneNumber: string,
    expiresAt: number,
  ) => void;
  "connection:authenticated": (jid: string) => void;
  "connection:error": (error: Error, context: string) => void;
  "message:received": (message: any) => void;
  "session:backup": (backupPath: string) => void;
  "session:restored": (sessionId: string) => void;
}

/**
 * WhatsApp Connection Manager
 *
 * Entry point utama untuk mengelola koneksi WhatsApp dengan
 * semua fitur authentication dan reconnect.
 */
export class ConnectionManager extends EventEmitter {
  private config: ConnectionManagerConfig;
  private sessionStore: SessionStore;
  private qrHandler: QRHandler | null = null;
  private pairingHandler: PairingHandler | null = null;
  private reconnectHandler: ReconnectHandler;
  private eventEmitter: BaileysEventEmitter;
  private socket: WASocket | null = null;
  private saveCreds: (() => Promise<void>) | null = null;
  private logger: any;

  private _status: ConnectionStatus = "disconnected";
  private isDestroyed = false;
  private reconnectPromise: Promise<void> | null = null;

  constructor(config: ConnectionManagerConfig) {
    super();

    this.config = {
      sessionBasePath: DEFAULT_SESSION_BASE_PATH,
      enableQR: true,
      enablePairing: true,
      ...config,
    };

    // Initialize logger
    this.logger =
      config.logger ||
      pino({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  ignore: "hostname",
                  translateTime: "SYS:standard",
                },
              },
      });

    // Initialize session store
    this.sessionStore = createSessionStore(
      this.config.sessionBasePath!,
      this.config.sessionId,
    );

    // Initialize reconnect handler
    this.reconnectHandler = new ReconnectHandler(this.config.reconnectOptions);

    // Initialize event emitter
    this.eventEmitter = new BaileysEventEmitter(this.config.redisUrl);

    // Setup internal event handlers
    this.setupInternalHandlers();

    this.logger.info(
      `[ConnectionManager] Initialized for session: ${this.config.sessionId}`,
    );
  }

  /**
   * Setup internal event handlers
   */
  private setupInternalHandlers(): void {
    // Session store events
    this.sessionStore.on?.("session:backup", (backupPath: string) => {
      this.emit("session:backup", backupPath);
    });

    // Event emitter forwarding
    this.eventEmitter.on("auth:success", (data) => {
      this.emit("connection:authenticated", data.jid);
    });

    this.eventEmitter.on("message:received", (message) => {
      this.emit("message:received", message);
    });

    this.eventEmitter.on("connection:status", (data) => {
      this.setStatus(data.status as ConnectionStatus);
    });
  }

  /**
   * Get current connection status
   */
  get status(): ConnectionStatus {
    return this._status;
  }

  /**
   * Set connection status dengan event emit
   */
  private setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.logger.info(`[ConnectionManager] Status changed: ${status}`);
      this.emit("connection:status", status);
    }
  }

  /**
   * Get session metadata
   */
  async getSessionInfo() {
    return {
      sessionId: this.config.sessionId,
      sessionPath: this.sessionStore.getSessionPath(),
      sessionExists: this.sessionStore.sessionExists(),
      metadata: await this.sessionStore.getMetadata(),
      reconnectStats: this.reconnectHandler.getStats(),
      status: this.status,
    };
  }

  /**
   * Connect menggunakan QR code
   *
   * @returns Promise yang resolve ketika authenticated
   */
  async connectWithQR(): Promise<void> {
    if (!this.config.enableQR) {
      throw new Error("QR authentication is disabled");
    }

    this.logger.info("[ConnectionManager] Starting QR authentication...");
    this.setStatus("connecting");

    try {
      // Initialize QR handler jika belum ada
      if (!this.qrHandler) {
        this.qrHandler = new QRHandler(this.config.qrOptions);
        this.setupQRHandlers();
      }

      await this.initializeConnection();

      // Wait for authentication
      await this.waitForAuthentication();

      this.logger.info("[ConnectionManager] QR authentication successful");
    } catch (error) {
      this.logger.error("[ConnectionManager] QR authentication failed:", error);
      this.setStatus("failed");
      throw error;
    }
  }

  /**
   * Connect menggunakan pairing code
   *
   * @param phoneNumber - Nomor telepon dengan country code
   * @returns Promise dengan pairing code
   */
  async connectWithPairing(phoneNumber: string): Promise<string> {
    if (!this.config.enablePairing) {
      throw new Error("Pairing authentication is disabled");
    }

    this.logger.info(
      `[ConnectionManager] Starting pairing authentication for: ${phoneNumber}`,
    );
    this.setStatus("connecting");

    try {
      // Initialize pairing handler jika belum ada
      if (!this.pairingHandler) {
        this.pairingHandler = new PairingHandler();
        this.setupPairingHandlers();
      }

      await this.initializeConnection();

      if (!this.socket) {
        throw new Error("Socket not initialized");
      }

      // Request pairing code
      this.pairingHandler.setSocket(this.socket);
      const result = await this.pairingHandler.requestPairingCode(phoneNumber);

      if (!result.success || !result.code) {
        throw new Error(result.error || "Failed to get pairing code");
      }

      this.logger.info(
        `[ConnectionManager] Pairing code generated: ${result.code}`,
      );
      return result.code;
    } catch (error) {
      this.logger.error(
        "[ConnectionManager] Pairing authentication failed:",
        error,
      );
      this.setStatus("failed");
      throw error;
    }
  }

  /**
   * Initialize socket connection
   */
  private async initializeConnection(): Promise<void> {
    const config = loadConfig();

    const socketConfig: SocketConfig = {
      sessionPath: this.sessionStore.getSessionPath(),
      printQRInTerminal: false, // QR handled by QRHandler
      browser: ["WhatsApp SLA", "Chrome", "1.0.0"],
      logger: this.logger,
      retryRequestDelayMs: config.baileys.reconnectBaseDelay,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    };

    this.logger.info("[ConnectionManager] Initializing socket...");
    const result = await initializeSocket(
      socketConfig,
      this.eventEmitter,
      this.config.sessionId,
    );

    this.socket = result.socket;
    this.saveCreds = result.saveCreds;

    this.logger.info("[ConnectionManager] Socket initialized successfully");
  }

  /**
   * Setup QR handler events
   */
  private setupQRHandlers(): void {
    if (!this.qrHandler) return;

    this.qrHandler.on("qr:generated", (data) => {
      this.emit("connection:qr", data.raw, data.attempt);
    });

    this.qrHandler.on("qr:expired", (attempt) => {
      this.logger.warn(`[ConnectionManager] QR expired (attempt ${attempt})`);
    });

    this.qrHandler.on("qr:max-retries", () => {
      this.setStatus("failed");
      this.emit("connection:error", new Error("Max QR retries exceeded"), "qr");
    });

    this.qrHandler.on("qr:cleared", () => {
      this.logger.info("[ConnectionManager] QR authentication completed");
    });
  }

  /**
   * Setup pairing handler events
   */
  private setupPairingHandlers(): void {
    if (!this.pairingHandler) return;

    this.pairingHandler.on("pairing:code", (data) => {
      this.emit(
        "connection:pairing",
        data.code,
        data.phoneNumber,
        data.expiresAt,
      );
    });

    this.pairingHandler.on("pairing:success", (data) => {
      this.logger.info(`[ConnectionManager] Pairing successful: ${data.jid}`);
      this.setStatus("connected");
    });

    this.pairingHandler.on("pairing:error", (data) => {
      this.emit("connection:error", new Error(data.error), "pairing");
    });

    this.pairingHandler.on("pairing:expired", (data) => {
      this.logger.warn(
        `[ConnectionManager] Pairing expired for: ${data.phoneNumber}`,
      );
    });
  }

  /**
   * Wait for authentication to complete
   */
  private async waitForAuthentication(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Authentication timeout"));
      }, 120000); // 2 minutes

      const onAuthenticated = () => {
        clearTimeout(timeout);
        this.setStatus("connected");
        this.reconnectHandler.resetOnSuccess();
        resolve();
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      };

      this.once("connection:authenticated", onAuthenticated);
      this.once("connection:error", onError);
    });
  }

  /**
   * Disconnect dari WhatsApp
   */
  async disconnect(): Promise<void> {
    this.logger.info("[ConnectionManager] Disconnecting...");
    this.setStatus("disconnected");

    if (this.socket) {
      await disconnectSocket(this.socket, this.eventEmitter);
      this.socket = null;
      this.saveCreds = null;
    }

    this.logger.info("[ConnectionManager] Disconnected successfully");
  }

  /**
   * Backup session saat ini
   */
  async backupSession(): Promise<string> {
    this.logger.info("[ConnectionManager] Creating session backup...");
    const backupPath = await this.sessionStore.backupSession();
    this.emit("session:backup", backupPath);
    this.logger.info(`[ConnectionManager] Session backed up to: ${backupPath}`);
    return backupPath;
  }

  /**
   * Restore session dari backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    this.logger.info(
      `[ConnectionManager] Restoring session from: ${backupPath}`,
    );

    // Disconnect jika sedang terhubung
    if (this.status !== "disconnected") {
      await this.disconnect();
    }

    await this.sessionStore.restoreFromBackup(backupPath);
    this.emit("session:restored", this.config.sessionId);
    this.logger.info("[ConnectionManager] Session restored successfully");
  }

  /**
   * List backup yang tersedia
   */
  async listBackups(): Promise<string[]> {
    return await this.sessionStore.listBackups();
  }

  /**
   * Clear session (logout)
   */
  async clearSession(): Promise<void> {
    this.logger.info("[ConnectionManager] Clearing session...");

    // Disconnect dulu
    if (this.status !== "disconnected") {
      await this.disconnect();
    }

    await this.sessionStore.deleteSession();
    this.logger.info("[ConnectionManager] Session cleared");
  }

  /**
   * Destroy connection manager dan cleanup
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.logger.info("[ConnectionManager] Destroying connection manager...");

    // Disconnect
    await this.disconnect();

    // Cleanup handlers
    this.qrHandler?.destroy();
    this.pairingHandler?.destroy();
    await this.eventEmitter.close();

    // Remove all listeners
    this.removeAllListeners();

    this.logger.info("[ConnectionManager] Connection manager destroyed");
  }

  /**
   * Check apakah socket terhubung
   */
  isConnected(): boolean {
    return this.status === "connected" && this.socket !== null;
  }

  /**
   * Get current socket (untuk advanced usage)
   */
  getSocket(): WASocket | null {
    return this.socket;
  }

  /**
   * Get session store (untuk advanced usage)
   */
  getSessionStore(): SessionStore {
    return this.sessionStore;
  }

  /**
   * Manual reconnect trigger
   */
  async reconnect(): Promise<void> {
    if (this.reconnectPromise) {
      return this.reconnectPromise;
    }

    this.logger.info("[ConnectionManager] Manual reconnect triggered");
    this.setStatus("reconnecting");

    this.reconnectPromise = this.reconnectHandler
      .reconnect(async () => {
        await this.initializeConnection();
      })
      .finally(() => {
        this.reconnectPromise = null;
      });

    await this.reconnectPromise;
    this.setStatus("connected");
  }
}

/**
 * Factory function untuk create ConnectionManager
 */
export function createConnectionManager(
  config: ConnectionManagerConfig,
): ConnectionManager {
  return new ConnectionManager(config);
}

// Type augmentation untuk proper event typing
declare interface ConnectionManager {
  on<K extends keyof ConnectionManagerEvents>(
    event: K,
    listener: ConnectionManagerEvents[K],
  ): this;
  emit<K extends keyof ConnectionManagerEvents>(
    event: K,
    ...args: Parameters<ConnectionManagerEvents[K]>
  ): boolean;
  off<K extends keyof ConnectionManagerEvents>(
    event: K,
    listener: ConnectionManagerEvents[K],
  ): this;
  once<K extends keyof ConnectionManagerEvents>(
    event: K,
    listener: ConnectionManagerEvents[K],
  ): this;
}

export default ConnectionManager;
