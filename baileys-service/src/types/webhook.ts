/**
 * Webhook types untuk komunikasi Baileys -> Laravel
 * Standarisasi payload dan signature verification
 */

import { ErrorCode } from "./index";
import { PROTOCOL_TIMEOUTS, PROTOCOL_RETRY } from "./index";

// =============================================================================
// WEBHOOK EVENT TYPES
// =============================================================================

export type WebhookEventType =
  | "message.received"
  | "message.sent"
  | "message.status"
  | "connection.update"
  | "auth.qr_code"
  | "auth.pairing_code"
  | "auth.success"
  | "auth.failure"
  | "presence.update"
  | "group.update"
  | "error";

// =============================================================================
// WEBHOOK PAYLOAD STRUCTURES
// =============================================================================

export interface BaseWebhookPayload {
  event: WebhookEventType;
  timestamp: number;
  sessionId: string;
  source: "baileys-service";
  version: string;
}

export interface MessageReceivedPayload extends BaseWebhookPayload {
  event: "message.received";
  data: {
    messageId: string;
    from: string;
    sender: string;
    isGroup: boolean;
    groupId?: string;
    message: {
      type:
        | "text"
        | "image"
        | "video"
        | "audio"
        | "document"
        | "sticker"
        | "location"
        | "contact";
      content: string;
      caption?: string;
      mimetype?: string;
      filename?: string;
      latitude?: number;
      longitude?: number;
    };
    quotedMessage?: {
      messageId: string;
      content: string;
    };
    mentions?: string[];
  };
}

export interface MessageSentPayload extends BaseWebhookPayload {
  event: "message.sent";
  data: {
    messageId: string;
    to: string;
    status: "sent" | "delivered" | "read";
    timestamp: number;
  };
}

export interface MessageStatusPayload extends BaseWebhookPayload {
  event: "message.status";
  data: {
    messageId: string;
    status: "sent" | "delivered" | "read" | "failed";
    timestamp: number;
    error?: string;
  };
}

export interface ConnectionUpdatePayload extends BaseWebhookPayload {
  event: "connection.update";
  data: {
    status: "connecting" | "connected" | "disconnected" | "reconnecting";
    reason?: string;
    retryAttempt?: number;
  };
}

export interface AuthQRCodePayload extends BaseWebhookPayload {
  event: "auth.qr_code";
  data: {
    qrCode: string;
    expiresAt: number;
    attempt: number;
  };
}

export interface AuthPairingCodePayload extends BaseWebhookPayload {
  event: "auth.pairing_code";
  data: {
    pairingCode: string;
    phoneNumber: string;
    expiresAt: number;
  };
}

export interface AuthSuccessPayload extends BaseWebhookPayload {
  event: "auth.success";
  data: {
    phoneNumber: string;
    name?: string;
    platform?: string;
  };
}

export interface AuthFailurePayload extends BaseWebhookPayload {
  event: "auth.failure";
  data: {
    reason: string;
    code: ErrorCode;
  };
}

export interface PresenceUpdatePayload extends BaseWebhookPayload {
  event: "presence.update";
  data: {
    jid: string;
    presence:
      | "available"
      | "unavailable"
      | "composing"
      | "recording"
      | "paused";
    lastSeen?: number;
  };
}

export interface GroupUpdatePayload extends BaseWebhookPayload {
  event: "group.update";
  data: {
    groupId: string;
    action:
      | "create"
      | "update"
      | "delete"
      | "participant_add"
      | "participant_remove";
    by: string;
    participants?: string[];
    changes?: Record<string, any>;
  };
}

export interface ErrorPayload extends BaseWebhookPayload {
  event: "error";
  data: {
    code: ErrorCode;
    message: string;
    details?: any;
    recoverable: boolean;
  };
}

export type WebhookPayload =
  | MessageReceivedPayload
  | MessageSentPayload
  | MessageStatusPayload
  | ConnectionUpdatePayload
  | AuthQRCodePayload
  | AuthPairingCodePayload
  | AuthSuccessPayload
  | AuthFailurePayload
  | PresenceUpdatePayload
  | GroupUpdatePayload
  | ErrorPayload;

// =============================================================================
// WEBHOOK REQUEST/RESPONSE
// =============================================================================

export interface WebhookRequest {
  url: string;
  method: "POST";
  headers: {
    "Content-Type": "application/json";
    "User-Agent": "BaileysService/1.0";
    "X-Webhook-Source": "baileys-service";
    "X-Webhook-Event": WebhookEventType;
    "X-Webhook-Timestamp": string;
    "X-Webhook-Signature"?: string;
  };
  body: WebhookPayload;
  timeout: number;
}

export interface WebhookResponse {
  success: boolean;
  statusCode: number;
  body?: any;
  error?: string;
  duration: number;
}

export interface WebhookDeliveryResult {
  webhookId: string;
  event: WebhookEventType;
  url: string;
  success: boolean;
  statusCode?: number;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  error?: string;
}

// =============================================================================
// WEBHOOK CONFIGURATION
// =============================================================================

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: WebhookEventType[] | ["all"];
  timeout: number;
  retryCount: number;
  retryDelay: number;
  enabled: boolean;
}

export const defaultWebhookConfig: WebhookConfig = {
  url: "",
  events: ["all"],
  timeout: PROTOCOL_TIMEOUTS.HTTP_REQUEST,
  retryCount: PROTOCOL_RETRY.HTTP_MAX,
  retryDelay: 5000,
  enabled: true,
};

// =============================================================================
// SIGNATURE UTILITIES
// =============================================================================

import * as crypto from "crypto";

/**
 * Generate HMAC signature untuk webhook payload
 */
export function generateWebhookSignature(
  payload: WebhookPayload,
  secret: string,
): string {
  const data = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | WebhookPayload,
  signature: string,
  secret: string,
): boolean {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// =============================================================================
// WEBHOOK BUILDER
// =============================================================================

/**
 * Create webhook payload dengan base fields
 */
export function createWebhookPayload<T extends WebhookEventType>(
  event: T,
  sessionId: string,
  data: any,
): BaseWebhookPayload & { data: any } {
  return {
    event,
    timestamp: Date.now(),
    sessionId,
    source: "baileys-service",
    version: "1.0.0",
    data,
  };
}

/**
 * Create full webhook request
 */
export function createWebhookRequest(
  config: WebhookConfig,
  payload: WebhookPayload,
): WebhookRequest {
  const headers: WebhookRequest["headers"] = {
    "Content-Type": "application/json",
    "User-Agent": "BaileysService/1.0",
    "X-Webhook-Source": "baileys-service",
    "X-Webhook-Event": payload.event,
    "X-Webhook-Timestamp": payload.timestamp.toString(),
  };

  if (config.secret) {
    headers["X-Webhook-Signature"] = generateWebhookSignature(
      payload,
      config.secret,
    );
  }

  return {
    url: config.url,
    method: "POST",
    headers,
    body: payload,
    timeout: config.timeout,
  };
}

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default {
  defaultWebhookConfig,
  generateWebhookSignature,
  verifyWebhookSignature,
  createWebhookPayload,
  createWebhookRequest,
} as const;
