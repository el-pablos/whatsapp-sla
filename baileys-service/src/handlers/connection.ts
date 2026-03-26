import {
  ConnectionUpdate,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { connectionLogger as logger } from "../utils/logger";
import { sleep, retryWithBackoff } from "../utils/helpers";
import { config } from "../config";

export interface ConnectionHandlerEvents {
  "connection:open": () => void;
  "connection:close": (reason: DisconnectReason) => void;
  "connection:reconnecting": (attempt: number, delay: number) => void;
  "connection:failed": (error: Error) => void;
}

/**
 * Connection handler untuk mengelola koneksi WhatsApp
 */
export class ConnectionHandler {
  private socket: WASocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isReconnecting = false;

  constructor() {
    this.handleConnectionUpdate = this.handleConnectionUpdate.bind(this);
  }

  /**
   * Set socket instance
   */
  public setSocket(socket: WASocket): void {
    this.socket = socket;
    this.setupConnectionListeners();
  }

  /**
   * Setup connection event listeners
   */
  private setupConnectionListeners(): void {
    if (!this.socket) return;

    this.socket.ev.on("connection.update", this.handleConnectionUpdate);
  }

  /**
   * Handle connection update dari Baileys
   */
  private async handleConnectionUpdate(
    update: ConnectionUpdate,
  ): Promise<void> {
    const { connection, lastDisconnect } = update;

    logger.info({ connection, lastDisconnect }, "Connection update received");

    switch (connection) {
      case "open":
        await this.handleConnectionOpen();
        break;

      case "close":
        await this.handleConnectionClose(lastDisconnect);
        break;

      case "connecting":
        logger.info("Connecting to WhatsApp...");
        break;
    }
  }

  /**
   * Handle connection opened
   */
  private async handleConnectionOpen(): Promise<void> {
    this.isConnected = true;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    logger.info(
      {
        user: this.socket?.user?.id,
        name: this.socket?.user?.name,
      },
      "WhatsApp connection established",
    );

    // Emit event untuk subscribers
    this.emit("connection:open");
  }

  /**
   * Handle connection closed
   */
  private async handleConnectionClose(lastDisconnect?: any): Promise<void> {
    this.isConnected = false;

    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const reason = this.parseDisconnectReason(statusCode);

    logger.warn(
      {
        statusCode,
        reason,
        lastDisconnect,
      },
      "Connection closed",
    );

    this.emit("connection:close", reason);

    // Tentukan apakah perlu reconnect
    const shouldReconnect = this.shouldAttemptReconnect(reason);

    if (shouldReconnect) {
      await this.attemptReconnect();
    } else {
      logger.error({ reason }, "No reconnect attempt - permanent failure");
      this.emit("connection:failed", new Error(`Connection failed: ${reason}`));
    }
  }

  /**
   * Parse status code menjadi DisconnectReason
   */
  private parseDisconnectReason(statusCode?: number): DisconnectReason {
    switch (statusCode) {
      case 401:
        return DisconnectReason.loggedOut;
      case 403:
        return DisconnectReason.forbidden;
      case 408:
        return DisconnectReason.timedOut;
      case 411:
        return DisconnectReason.multideviceMismatch;
      case 428:
        return DisconnectReason.connectionClosed;
      case 440:
        return DisconnectReason.connectionLost;
      case 515:
        return DisconnectReason.restartRequired;
      default:
        return DisconnectReason.connectionClosed;
    }
  }

  /**
   * Tentukan apakah harus mencoba reconnect
   */
  private shouldAttemptReconnect(reason: DisconnectReason): boolean {
    // Tidak reconnect untuk error permanent
    const permanentErrors = [
      DisconnectReason.loggedOut,
      DisconnectReason.forbidden,
      DisconnectReason.multideviceMismatch,
    ];

    if (permanentErrors.includes(reason)) {
      return false;
    }

    // Cek max attempts
    if (this.reconnectAttempts >= config.baileys.reconnectMaxRetries) {
      return false;
    }

    return true;
  }

  /**
   * Attempt reconnect dengan exponential backoff
   */
  private async attemptReconnect(): Promise<void> {
    if (this.isReconnecting) {
      logger.debug("Already reconnecting, skipping");
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Calculate delay dengan exponential backoff
    const delay =
      config.baileys.reconnectBaseDelay *
      Math.pow(2, this.reconnectAttempts - 1);

    logger.info(
      {
        attempt: this.reconnectAttempts,
        maxAttempts: config.baileys.reconnectMaxRetries,
        delay,
      },
      "Attempting reconnect",
    );

    this.emit("connection:reconnecting", this.reconnectAttempts, delay);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.performReconnect();
      } catch (error) {
        logger.error({ error }, "Reconnect failed");
        this.isReconnecting = false;

        if (this.reconnectAttempts < config.baileys.reconnectMaxRetries) {
          await this.attemptReconnect();
        } else {
          this.emit("connection:failed", error as Error);
        }
      }
    }, delay);
  }

  /**
   * Perform actual reconnect
   */
  private async performReconnect(): Promise<void> {
    if (!this.socket) {
      throw new Error("No socket instance available for reconnect");
    }

    // Emit reconnect event to socket manager
    // Socket manager akan handle re-initialization
    await sleep(1000); // Brief delay before reconnect
    this.isReconnecting = false;
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    isConnected: boolean;
    isReconnecting: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    user?: any;
  } {
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: config.baileys.reconnectMaxRetries,
      user: this.socket?.user,
    };
  }

  /**
   * Force disconnect
   */
  public async disconnect(): Promise<void> {
    logger.info("Forcing disconnect");

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;

    if (this.socket) {
      try {
        await this.socket.logout();
      } catch (error) {
        logger.error({ error }, "Error during logout");
      }
    }
  }

  /**
   * Reset connection state
   */
  public reset(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Cleanup handler
   */
  public destroy(): void {
    this.reset();

    if (this.socket) {
      this.socket.ev.off("connection.update", this.handleConnectionUpdate);
    }

    this.socket = null;
    logger.info("Connection handler destroyed");
  }

  // Event emitter stub - in real implementation, this would extend EventEmitter
  private emit(event: string, ...args: any[]): void {
    // Implementation would emit to parent socket manager or event bus
    logger.debug({ event, args }, "Emitting connection event");
  }
}

export default ConnectionHandler;
