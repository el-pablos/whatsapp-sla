/**
 * API types untuk Baileys service REST API
 * Standarisasi request/response format
 */

import { ErrorCode, ErrorResponse, SuccessResponse } from "./index";

// =============================================================================
// API HELPER FUNCTIONS
// =============================================================================

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  traceId?: string,
): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
    trace_id: traceId,
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode | string,
  message: string,
  details?: any,
  traceId?: string,
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: Date.now(),
    trace_id: traceId,
  };
}

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

export interface AuthInitRequest {
  method: "qr" | "pairing_code";
  phoneNumber?: string; // Required for pairing_code
}

export interface AuthInitResponse {
  sessionId: string;
  method: "qr" | "pairing_code";
  qrCode?: string;
  pairingCode?: string;
  expiresAt: number;
}

export interface AuthStatusResponse {
  sessionId: string;
  status: "pending" | "authenticated" | "failed" | "expired";
  phoneNumber?: string;
  message?: string;
}

export interface AuthLogoutRequest {
  sessionId: string;
  clearSession?: boolean;
}

// =============================================================================
// MESSAGE ENDPOINTS
// =============================================================================

export interface SendMessageRequest {
  sessionId: string;
  to: string;
  message: {
    type: "text" | "image" | "video" | "audio" | "document" | "location";
    content: string; // Text atau base64 untuk media
    caption?: string;
    filename?: string;
    mimetype?: string;
    latitude?: number;
    longitude?: number;
  };
  options?: {
    quoted?: string; // Message ID to quote
    linkPreview?: boolean;
    mentions?: string[];
  };
}

export interface SendMessageResponse {
  messageId: string;
  to: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  timestamp: number;
}

export interface MessageStatusRequest {
  sessionId: string;
  messageId: string;
}

export interface MessageStatusResponse {
  messageId: string;
  status: "sent" | "delivered" | "read" | "failed" | "unknown";
  timestamp: number;
  error?: string;
}

// =============================================================================
// CONNECTION ENDPOINTS
// =============================================================================

export interface ConnectionStatusResponse {
  sessionId: string;
  connected: boolean;
  status: "disconnected" | "connecting" | "connected" | "reconnecting";
  phoneNumber?: string;
  lastSeen?: number;
  uptime?: number;
}

export interface ReconnectRequest {
  sessionId: string;
  force?: boolean;
}

// =============================================================================
// CONTACT ENDPOINTS
// =============================================================================

export interface CheckNumberRequest {
  sessionId: string;
  phoneNumbers: string[];
}

export interface CheckNumberResponse {
  results: Array<{
    phoneNumber: string;
    exists: boolean;
    jid?: string;
  }>;
}

export interface GetProfileRequest {
  sessionId: string;
  jid: string;
}

export interface GetProfileResponse {
  jid: string;
  name?: string;
  status?: string;
  profilePicture?: string;
}

// =============================================================================
// GROUP ENDPOINTS
// =============================================================================

export interface CreateGroupRequest {
  sessionId: string;
  name: string;
  participants: string[];
}

export interface CreateGroupResponse {
  groupId: string;
  name: string;
  participants: string[];
  owner: string;
}

export interface GroupInfoResponse {
  groupId: string;
  name: string;
  description?: string;
  participants: Array<{
    jid: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }>;
  owner: string;
  createdAt: number;
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

export interface SessionListResponse {
  sessions: Array<{
    sessionId: string;
    phoneNumber?: string;
    status: "active" | "inactive" | "expired";
    lastActive: number;
    createdAt: number;
  }>;
}

export interface SessionDeleteRequest {
  sessionId: string;
  clearStorage?: boolean;
}

// =============================================================================
// HEALTHCHECK ENDPOINTS
// =============================================================================

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  checks: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    message?: string;
    duration: number;
  }>;
  timestamp: number;
}

// =============================================================================
// WEBHOOK CONFIGURATION
// =============================================================================

export interface WebhookConfigRequest {
  url: string;
  events: Array<
    | "message.received"
    | "message.sent"
    | "connection.update"
    | "auth.update"
    | "all"
  >;
  secret?: string;
  retryCount?: number;
}

export interface WebhookConfigResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: number;
}

// =============================================================================
// API ERROR MESSAGES (Indonesian)
// =============================================================================

export const API_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_FAILED]: "Autentikasi gagal. Silakan coba lagi.",
  [ErrorCode.AUTH_TIMEOUT]: "Waktu autentikasi habis. Silakan scan QR ulang.",
  [ErrorCode.SESSION_EXPIRED]: "Sesi sudah expired. Silakan login ulang.",
  [ErrorCode.QR_CODE_EXPIRED]: "QR Code sudah expired. Silakan minta QR baru.",
  [ErrorCode.PAIRING_CODE_EXPIRED]:
    "Kode pairing sudah expired. Silakan minta kode baru.",
  [ErrorCode.CONNECTION_FAILED]: "Gagal terhubung ke WhatsApp.",
  [ErrorCode.CONNECTION_TIMEOUT]: "Koneksi timeout. Silakan coba lagi.",
  [ErrorCode.CONNECTION_LOST]: "Koneksi terputus.",
  [ErrorCode.WEBSOCKET_ERROR]: "Terjadi error WebSocket.",
  [ErrorCode.SEND_FAILED]: "Gagal mengirim pesan.",
  [ErrorCode.SEND_TIMEOUT]: "Timeout saat mengirim pesan.",
  [ErrorCode.MESSAGE_TOO_LARGE]: "Ukuran pesan terlalu besar.",
  [ErrorCode.RECIPIENT_NOT_FOUND]: "Penerima tidak ditemukan di WhatsApp.",
  [ErrorCode.RATE_LIMIT_EXCEEDED]: "Batas request tercapai. Coba lagi nanti.",
  [ErrorCode.QUEUE_FULL]: "Antrian penuh. Coba lagi nanti.",
  [ErrorCode.INVALID_PHONE_NUMBER]: "Format nomor telepon tidak valid.",
  [ErrorCode.INVALID_MESSAGE_TYPE]: "Tipe pesan tidak didukung.",
  [ErrorCode.INVALID_MEDIA_FORMAT]: "Format media tidak didukung.",
  [ErrorCode.INTERNAL_ERROR]: "Terjadi kesalahan internal.",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service tidak tersedia.",
  [ErrorCode.TIMEOUT_EXCEEDED]: "Waktu tunggu habis.",
  [ErrorCode.LARAVEL_API_ERROR]: "Gagal berkomunikasi dengan Laravel API.",
  [ErrorCode.WEBHOOK_FAILED]: "Gagal mengirim webhook.",
};

/**
 * Get human-readable error message
 */
export function getErrorMessage(code: ErrorCode | string): string {
  return (
    API_ERROR_MESSAGES[code as ErrorCode] ||
    "Terjadi kesalahan yang tidak diketahui."
  );
}

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default {
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
  API_ERROR_MESSAGES,
} as const;
