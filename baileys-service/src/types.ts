/**
 * Type definitions untuk Baileys service
 */

import type { WASocket, AuthenticationState } from "@whiskeysockets/baileys";
import type { SessionStore } from "./auth/session-store";

export interface SocketConfig {
  sessionPath: string;
  printQRInTerminal?: boolean;
  browser?: [string, string, string];
  logger?: any;
  retryRequestDelayMs?: number;
  connectTimeoutMs?: number;
  defaultQueryTimeoutMs?: number;
}

export interface SocketInitResult {
  socket: WASocket;
  saveCreds: () => Promise<void>;
  state: AuthenticationState;
  sessionStore: SessionStore;
}

export interface ConnectionUpdate {
  connection?: "open" | "close" | "connecting";
  lastDisconnect?: {
    error?: any;
    date?: Date;
  };
  qr?: string;
  isNewLogin?: boolean;
  receivedPendingNotifications?: boolean;
}

export interface MessageEvent {
  from: string;
  sender: string;
  text: string;
  type: string;
  isGroup: boolean;
  timestamp: number;
  raw: any;
}

export interface BaileysVersionInfo {
  version: [number, number, number];
  isLatest: boolean;
}
