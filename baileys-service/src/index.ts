/**
 * Baileys WhatsApp Service
 *
 * Core WhatsApp automation service untuk Laravel backend.
 * Mengelola session, authentication, dan pesan WhatsApp.
 */

// Core Components
export {
  ConnectionManager,
  createConnectionManager,
} from "./core/connection-manager";
export type {
  ConnectionManagerConfig,
  ConnectionStatus,
  ConnectionManagerEvents,
} from "./core/connection-manager";

// Session Management
export {
  SessionStore,
  createSessionStore,
  DEFAULT_SESSION_BASE_PATH,
} from "./auth/session-store";
export type { SessionAuthState, SessionMetadata } from "./auth/session-store";

// Authentication Handlers
export { QRHandler } from "./auth/qr-handler";
export { PairingHandler } from "./auth/pairing-handler";
export type { QRData, QROptions } from "./auth/qr-handler";
export type {
  PairingCodeResult,
  PhoneValidationResult,
} from "./auth/pairing-handler";

// Connection Handlers
export { ReconnectHandler } from "./handlers/reconnect";
export { BaileysEventEmitter } from "./handlers/events";
export { handleDisconnect } from "./handlers/disconnect";
export type { DisconnectResult } from "./handlers/disconnect";

// Socket & Configuration
export {
  initializeSocket,
  getBaileysVersion,
  requestPairingCode,
  disconnectSocket,
} from "./socket";
export { loadConfig } from "./config";
export type {
  SocketConfig,
  SocketInitResult,
  BaileysVersionInfo,
  MessageEvent,
  ConnectionUpdate,
} from "./types";

// Re-export Baileys types yang sering digunakan
export type { WASocket, AuthenticationState } from "@whiskeysockets/baileys";

// Default export
export { ConnectionManager as default } from "./core/connection-manager";
