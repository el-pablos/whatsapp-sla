/**
 * Socket Initializer untuk Baileys WhatsApp Client
 *
 * Handle inisialisasi socket dengan:
 * - Fetch latest Baileys version
 * - Load or create auth state
 * - Create socket dengan configuration
 * - Setup event handlers
 */

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import { BaileysEventEmitter } from "./handlers/events";
import { handleDisconnect } from "./handlers/disconnect";
import {
  SessionStore,
  createSessionStore,
  DEFAULT_SESSION_BASE_PATH,
} from "./auth/session-store";
import type {
  SocketConfig,
  SocketInitResult,
  BaileysVersionInfo,
} from "./types";

/**
 * Default configuration untuk socket
 */
const DEFAULT_CONFIG: Partial<SocketConfig> = {
  printQRInTerminal: false,
  browser: ["WhatsApp SLA", "Chrome", "1.0.0"],
  retryRequestDelayMs: 1000,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 60000,
};

/**
 * Fetch latest Baileys version dari WhatsApp servers
 */
export async function getBaileysVersion(): Promise<BaileysVersionInfo> {
  try {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(
      `[Baileys] Using version ${version.join(".")}, isLatest: ${isLatest}`,
    );
    return { version, isLatest };
  } catch (error) {
    console.error("[Baileys] Failed to fetch version, using default:", error);
    // Fallback ke version default jika fetch gagal
    return {
      version: [2, 3000, 0],
      isLatest: false,
    };
  }
}

/**
 * Ensure session directory exists
 */
function ensureSessionDirectory(sessionPath: string): void {
  if (!fs.existsSync(sessionPath)) {
    console.log(`[Socket] Creating session directory: ${sessionPath}`);
    fs.mkdirSync(sessionPath, { recursive: true });
  }
}

/**
 * Validate session path
 */
function validateSessionPath(sessionPath: string): void {
  if (!sessionPath || typeof sessionPath !== "string") {
    throw new Error("Session path harus berupa string yang valid");
  }

  const resolvedPath = path.resolve(sessionPath);
  if (!resolvedPath.startsWith(process.cwd())) {
    throw new Error("Session path harus berada di dalam project directory");
  }
}

/**
 * Initialize WhatsApp socket dengan configuration
 *
 * @param config - Socket configuration
 * @param eventEmitter - Optional event emitter untuk publish events ke Redis
 * @returns Promise<SocketInitResult>
 */
export async function initializeSocket(
  config: SocketConfig,
  eventEmitter?: BaileysEventEmitter,
  sessionId: string = "default",
): Promise<SocketInitResult> {
  try {
    // 1. Validate configuration
    validateSessionPath(config.sessionPath);

    // 2. Create session store
    const basePath = path.dirname(config.sessionPath);
    const sessionStore = createSessionStore(basePath, sessionId);

    // 3. Initialize session (ensure directory exists and get auth state)
    console.log(
      `[Socket] Initializing session store: ${sessionStore.getSessionPath()}`,
    );
    const { state, saveCreds } = await sessionStore.initialize();

    // 4. Fetch latest Baileys version
    const { version } = await getBaileysVersion();

    // 5. Create logger
    const logger =
      config.logger ||
      pino({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "hostname",
            translateTime: "SYS:standard",
          },
        },
      });

    // 6. Create socket dengan configuration
    console.log("[Socket] Creating WhatsApp socket...");
    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal:
        config.printQRInTerminal ?? DEFAULT_CONFIG.printQRInTerminal,
      browser: config.browser ?? DEFAULT_CONFIG.browser,
      retryRequestDelayMs:
        config.retryRequestDelayMs ?? DEFAULT_CONFIG.retryRequestDelayMs,
      connectTimeoutMs:
        config.connectTimeoutMs ?? DEFAULT_CONFIG.connectTimeoutMs,
      defaultQueryTimeoutMs:
        config.defaultQueryTimeoutMs ?? DEFAULT_CONFIG.defaultQueryTimeoutMs,

      // Generate ID tinggi untuk mencegah konflik
      generateHighQualityLinkPreview: true,

      // Sync full history
      syncFullHistory: false,

      // Mark messages as read
      markOnlineOnConnect: true,
    });

    // 7. Setup event handlers
    setupEventHandlers(socket, saveCreds, eventEmitter, sessionStore);

    console.log("[Socket] Socket initialized successfully");

    return {
      socket,
      saveCreds,
      state,
      sessionStore, // Include session store in return
    };
  } catch (error) {
    console.error("[Socket] Failed to initialize:", error);
    throw error;
  }
}

/**
 * Setup event handlers untuk socket
 */
function setupEventHandlers(
  socket: WASocket,
  saveCreds: () => Promise<void>,
  eventEmitter?: BaileysEventEmitter,
  sessionStore?: SessionStore,
): void {
  // Event: credentials update
  socket.ev.on("creds.update", async () => {
    try {
      await saveCreds();
      console.log("[Socket] Credentials saved");
    } catch (error) {
      console.error("[Socket] Failed to save credentials:", error);
    }
  });

  // Event: connection update
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update;

    // Handle QR code generation
    if (qr) {
      console.log("[Socket] QR code generated");
      if (eventEmitter) {
        await eventEmitter.emitQRGenerated(qr);
      }
    }

    // Handle connection status
    if (connection === "open") {
      console.log("[Socket] ✅ Connection opened successfully");
      const jid = socket.user?.id || "unknown";
      console.log(`[Socket] Logged in as: ${jid}`);

      if (eventEmitter) {
        await eventEmitter.emitAuthSuccess(jid);
        await eventEmitter.emitConnectionStatus("open");
      }

      if (isNewLogin) {
        console.log("[Socket] 🎉 New login detected");
      }
    }

    if (connection === "close") {
      console.log("[Socket] ❌ Connection closed");

      if (eventEmitter) {
        await eventEmitter.emitConnectionStatus("close");
      }

      // Handle disconnect dengan logic yang proper
      if (lastDisconnect) {
        const disconnectResult = handleDisconnect(lastDisconnect);

        console.log(
          `[Socket] Disconnect reason: ${disconnectResult.reason} (code: ${disconnectResult.code})`,
        );
        console.log(`[Socket] Action: ${disconnectResult.action}`);

        if (eventEmitter) {
          await eventEmitter.emitEvent(
            "connection:disconnect",
            disconnectResult,
          );
        }

        // Clear session jika diperlukan
        if (disconnectResult.shouldClearSession && sessionStore) {
          console.log("[Socket] Clearing session...");
          try {
            await sessionStore.deleteSession();
            console.log("[Socket] Session cleared");
          } catch (error) {
            console.error("[Socket] Failed to clear session:", error);
          }
        }

        // Throw error untuk trigger reconnect logic di level yang lebih tinggi
        if (disconnectResult.action === "fatal") {
          throw new Error(`Fatal disconnect: ${disconnectResult.reason}`);
        }
      }
    }

    if (connection === "connecting") {
      console.log("[Socket] 🔄 Connecting...");
      if (eventEmitter) {
        await eventEmitter.emitConnectionStatus("reconnecting");
      }
    }
  });

  // Event: messages upsert (new messages)
  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    console.log(
      `[Socket] Received ${messages.length} message(s), type: ${type}`,
    );

    if (eventEmitter) {
      for (const message of messages) {
        await eventEmitter.emitMessageReceived({
          key: message.key,
          message: message.message,
          messageTimestamp: message.messageTimestamp,
          pushName: message.pushName,
        });
      }
    }
  });

  // Event: group updates
  socket.ev.on("groups.update", (updates) => {
    console.log(`[Socket] Group updates: ${updates.length}`);
  });

  // Event: presence updates
  socket.ev.on("presence.update", (update) => {
    // Silent, terlalu banyak event
  });

  // Event: chats set (initial chats load)
  socket.ev.on("chats.set", ({ chats }) => {
    console.log(`[Socket] Loaded ${chats.length} chats`);
  });

  // Event: messages set (initial messages load)
  socket.ev.on("messages.set", ({ messages }) => {
    console.log(`[Socket] Loaded ${messages.length} messages`);
  });

  // Event: contacts set
  socket.ev.on("contacts.set", ({ contacts }) => {
    console.log(`[Socket] Loaded ${contacts.length} contacts`);
  });
}

/**
 * Helper untuk request pairing code
 */
export async function requestPairingCode(
  socket: WASocket,
  phoneNumber: string,
): Promise<string> {
  try {
    // Validasi format nomor
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      throw new Error("Nomor telepon tidak valid");
    }

    console.log(`[Socket] Requesting pairing code for: ${cleanNumber}`);
    const code = await socket.requestPairingCode(cleanNumber);
    console.log(`[Socket] ✅ Pairing code generated: ${code}`);

    return code;
  } catch (error) {
    console.error("[Socket] Failed to request pairing code:", error);
    throw error;
  }
}

/**
 * Helper untuk disconnect socket dengan cleanup
 */
export async function disconnectSocket(
  socket: WASocket,
  eventEmitter?: BaileysEventEmitter,
): Promise<void> {
  try {
    console.log("[Socket] Disconnecting socket...");

    if (eventEmitter) {
      await eventEmitter.emitConnectionStatus("close");
      await eventEmitter.close();
    }

    socket.end(undefined);
    console.log("[Socket] ✅ Socket disconnected");
  } catch (error) {
    console.error("[Socket] Error during disconnect:", error);
    throw error;
  }
}

export default {
  initializeSocket,
  getBaileysVersion,
  requestPairingCode,
  disconnectSocket,
};
