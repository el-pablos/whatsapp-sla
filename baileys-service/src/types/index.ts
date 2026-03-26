/**
 * WhatsApp SLA - Baileys Service Protocol Standardization
 * Comprehensive type definitions dengan protocol standardization
 */

import type { WASocket, AuthenticationState } from "@whiskeysockets/baileys";
import type { SessionStore } from "../auth/session-store";

// =============================================================================
// PROTOCOL CONSTANTS (Standarisasi Timeout)
// =============================================================================

export const PROTOCOL_TIMEOUTS = {
  HTTP_REQUEST: 30 * 1000, // 30 seconds
  WEBSOCKET_PING: 25 * 1000, // 25 seconds
  MESSAGE_SEND: 10 * 1000, // 10 seconds
  AUTH: 120 * 1000, // 120 seconds (2 menit)
  QR_CODE: 60 * 1000, // 60 seconds
  PAIRING_CODE: 120 * 1000, // 120 seconds
  RECONNECT_BASE: 10 * 1000, // 10 seconds base delay
} as const;

export const PROTOCOL_RETRY = {
  HTTP_MAX: 3, // 3x retry HTTP dengan exponential backoff
  MESSAGE_MAX: 3, // 3x retry message
  CONNECTION_MAX: 10, // 10x retry connection
  EXPONENTIAL_BASE: 2, // 2^attempt multiplier
  JITTER_MAX: 1000, // Max 1s random jitter
} as const;

// =============================================================================
// STANDARDIZED RESPONSE FORMATS
// =============================================================================

export interface ErrorResponse {
  success: false;
  error: {
    code: string; // 'AUTH_FAILED', 'SEND_FAILED', 'TIMEOUT_EXCEEDED', etc
    message: string; // Human readable error message
    details?: any; // Optional error details/context
  };
  timestamp: number; // Unix timestamp
  trace_id?: string; // Optional tracing ID
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: number; // Unix timestamp
  trace_id?: string; // Optional tracing ID
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// =============================================================================
// STANDARDIZED ERROR CODES
// =============================================================================

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_FAILED = "AUTH_FAILED",
  AUTH_TIMEOUT = "AUTH_TIMEOUT",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  QR_CODE_EXPIRED = "QR_CODE_EXPIRED",
  PAIRING_CODE_EXPIRED = "PAIRING_CODE_EXPIRED",

  // Connection
  CONNECTION_FAILED = "CONNECTION_FAILED",
  CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT",
  CONNECTION_LOST = "CONNECTION_LOST",
  WEBSOCKET_ERROR = "WEBSOCKET_ERROR",

  // Message Sending
  SEND_FAILED = "SEND_FAILED",
  SEND_TIMEOUT = "SEND_TIMEOUT",
  MESSAGE_TOO_LARGE = "MESSAGE_TOO_LARGE",
  RECIPIENT_NOT_FOUND = "RECIPIENT_NOT_FOUND",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  QUEUE_FULL = "QUEUE_FULL",

  // Validation
  INVALID_PHONE_NUMBER = "INVALID_PHONE_NUMBER",
  INVALID_MESSAGE_TYPE = "INVALID_MESSAGE_TYPE",
  INVALID_MEDIA_FORMAT = "INVALID_MEDIA_FORMAT",

  // System
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT_EXCEEDED = "TIMEOUT_EXCEEDED",

  // Laravel Integration
  LARAVEL_API_ERROR = "LARAVEL_API_ERROR",
  WEBHOOK_FAILED = "WEBHOOK_FAILED",
}

// =============================================================================
// BAILEYS SOCKET CONFIGURATION
// =============================================================================

export interface SocketConfig {
  sessionPath: string;
  printQRInTerminal?: boolean;
  browser?: [string, string, string];
  logger?: any;
  retryRequestDelayMs?: number;
  connectTimeoutMs?: number;
  defaultQueryTimeoutMs?: number;

  // Standardized timeouts
  timeouts?: {
    httpRequest: number;
    websocketPing: number;
    messageSend: number;
    auth: number;
  };

  // Standardized retry config
  retry?: {
    httpMax: number;
    messageMax: number;
    connectionMax: number;
    exponentialBase: number;
  };
}

export interface SocketInitResult {
  socket: WASocket;
  saveCreds: () => Promise<void>;
  state: AuthenticationState;
  sessionStore: SessionStore;
}

// =============================================================================
// CONNECTION & STATE MANAGEMENT
// =============================================================================

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

export interface ConnectionState {
  status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error";
  lastConnected?: Date;
  lastDisconnected?: Date;
  retryAttempt: number;
  errorCount: number;
  sessionId: string;
  phoneNumber?: string;
}

// =============================================================================
// MESSAGE HANDLING
// =============================================================================

export interface MessageEvent {
  from: string;
  sender: string;
  text: string;
  type: string;
  isGroup: boolean;
  timestamp: number;
  raw: any;
  messageId: string;
  conversationId: string;
}

export interface OutgoingMessage {
  to: string;
  text?: string;
  media?: {
    type: "image" | "video" | "audio" | "document";
    data: Buffer;
    mimetype: string;
    filename?: string;
  };
  options?: {
    quoted?: any;
    linkPreview?: boolean;
    mentions?: string[];
  };
}

export interface MessageSendResult {
  messageId: string;
  timestamp: number;
  status: "sent" | "delivered" | "read" | "failed";
  error?: string;
}

// =============================================================================
// BAILEYS VERSION & METADATA
// =============================================================================

export interface BaileysVersionInfo {
  version: [number, number, number];
  isLatest: boolean;
}

export interface ServiceInfo {
  service: "baileys-whatsapp";
  version: string;
  baileys: BaileysVersionInfo;
  uptime: number;
  connections: {
    active: number;
    total: number;
  };
  health: {
    status: "healthy" | "degraded" | "unhealthy";
    checks: HealthCheck[];
  };
}

export interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
  duration: number;
  timestamp: number;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface BaileysConfig {
  sessionPath: string;
  apiPort: number;
  webhookUrl: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  browserName: string;
  browserVersion: string;
  reconnectMaxRetries: number;
  reconnectBaseDelay: number;
  qrTimeout: number;
  pairingCodeTimeout: number;

  // Standardized protocol config
  protocol: {
    timeouts: typeof PROTOCOL_TIMEOUTS;
    retry: typeof PROTOCOL_RETRY;
  };
}

export interface LaravelConfig {
  apiUrl: string;
  apiKey: string;
  endpoints: {
    webhook: string;
    messageStatus: string;
    contactSync: string;
  };
}

export interface Config {
  baileys: BaileysConfig;
  laravel: LaravelConfig;
  nodeEnv: string;
}

// =============================================================================
// WEBHOOK INTEGRATION
// =============================================================================

export interface WebhookPayload {
  event:
    | "message.received"
    | "message.sent"
    | "connection.update"
    | "auth.update";
  timestamp: number;
  sessionId: string;
  data: any;
  signature?: string;
}

export interface LaravelWebhookRequest {
  method: "POST";
  url: string;
  headers: {
    "Content-Type": "application/json";
    "X-Webhook-Source": "baileys-service";
    "X-Signature"?: string;
    Authorization?: string;
  };
  body: WebhookPayload;
  timeout: number;
  retryCount: number;
}

// =============================================================================
// HTTP CLIENT STANDARDIZATION
// =============================================================================

export interface HttpRequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  duration: number;
  retryAttempt: number;
}

// =============================================================================
// RETRY STRATEGY
// =============================================================================

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  exponentialBase: number;
  maxDelay: number;
  jitterMax: number;
  retryableErrors: string[];
  retryableStatusCodes: number[];
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attemptCount: number;
  totalDuration: number;
}

// =============================================================================
// LOGGING & MONITORING
// =============================================================================

export interface LogContext {
  sessionId: string;
  phoneNumber?: string;
  messageId?: string;
  conversationId?: string;
  duration?: number;
  error?: any;
  [key: string]: any;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  type: "counter" | "gauge" | "histogram" | "timer";
}

// =============================================================================
// QUEUE MANAGEMENT
// =============================================================================

export interface QueuedMessage {
  id: string;
  priority: "low" | "normal" | "high" | "critical";
  payload: OutgoingMessage;
  attempts: number;
  createdAt: Date;
  scheduledAt?: Date;
  processedAt?: Date;
  error?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
}

// =============================================================================
// EXPORT SEMUA TYPES
// =============================================================================

export * from "./protocol";
export * from "./api";
export * from "./webhook";

// Default export dengan semua konstanta protocol
export default {
  TIMEOUTS: PROTOCOL_TIMEOUTS,
  RETRY: PROTOCOL_RETRY,
  ErrorCode,
} as const;
