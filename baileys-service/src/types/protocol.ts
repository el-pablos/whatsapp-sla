/**
 * Protocol types untuk komunikasi antar services
 * Standarisasi timeout, retry, dan error handling
 */

import { PROTOCOL_TIMEOUTS, PROTOCOL_RETRY, ErrorCode } from "./index";

// =============================================================================
// TIMEOUT CONFIGURATION
// =============================================================================

export interface TimeoutConfig {
  httpRequest: number;
  websocketPing: number;
  messageSend: number;
  auth: number;
  qrCode: number;
  pairingCode: number;
  reconnectBase: number;
}

export const defaultTimeouts: TimeoutConfig = {
  httpRequest: PROTOCOL_TIMEOUTS.HTTP_REQUEST,
  websocketPing: PROTOCOL_TIMEOUTS.WEBSOCKET_PING,
  messageSend: PROTOCOL_TIMEOUTS.MESSAGE_SEND,
  auth: PROTOCOL_TIMEOUTS.AUTH,
  qrCode: PROTOCOL_TIMEOUTS.QR_CODE,
  pairingCode: PROTOCOL_TIMEOUTS.PAIRING_CODE,
  reconnectBase: PROTOCOL_TIMEOUTS.RECONNECT_BASE,
};

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  exponentialBase: number;
  maxDelayMs: number;
  jitterMs: number;
  retryableErrors: ErrorCode[];
  retryableStatusCodes: number[];
}

export const defaultHttpRetryPolicy: RetryPolicy = {
  maxAttempts: PROTOCOL_RETRY.HTTP_MAX,
  baseDelayMs: 1000,
  exponentialBase: PROTOCOL_RETRY.EXPONENTIAL_BASE,
  maxDelayMs: 30000,
  jitterMs: PROTOCOL_RETRY.JITTER_MAX,
  retryableErrors: [
    ErrorCode.CONNECTION_TIMEOUT,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.INTERNAL_ERROR,
  ],
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export const defaultMessageRetryPolicy: RetryPolicy = {
  maxAttempts: PROTOCOL_RETRY.MESSAGE_MAX,
  baseDelayMs: 2000,
  exponentialBase: PROTOCOL_RETRY.EXPONENTIAL_BASE,
  maxDelayMs: 15000,
  jitterMs: PROTOCOL_RETRY.JITTER_MAX,
  retryableErrors: [
    ErrorCode.SEND_TIMEOUT,
    ErrorCode.CONNECTION_LOST,
    ErrorCode.WEBSOCKET_ERROR,
  ],
  retryableStatusCodes: [],
};

export const defaultConnectionRetryPolicy: RetryPolicy = {
  maxAttempts: PROTOCOL_RETRY.CONNECTION_MAX,
  baseDelayMs: 5000,
  exponentialBase: PROTOCOL_RETRY.EXPONENTIAL_BASE,
  maxDelayMs: 300000, // 5 minutes max
  jitterMs: PROTOCOL_RETRY.JITTER_MAX * 2,
  retryableErrors: [
    ErrorCode.CONNECTION_FAILED,
    ErrorCode.CONNECTION_TIMEOUT,
    ErrorCode.WEBSOCKET_ERROR,
  ],
  retryableStatusCodes: [],
};

// =============================================================================
// EXPONENTIAL BACKOFF UTILITIES
// =============================================================================

/**
 * Calculate delay dengan exponential backoff dan jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  policy: RetryPolicy,
): number {
  const exponentialDelay =
    policy.baseDelayMs * Math.pow(policy.exponentialBase, attempt);
  const cappedDelay = Math.min(exponentialDelay, policy.maxDelayMs);
  const jitter = Math.random() * policy.jitterMs;
  return cappedDelay + jitter;
}

/**
 * Check apakah error dapat di-retry
 */
export function isRetryableError(
  error: Error | any,
  policy: RetryPolicy,
): boolean {
  if (error.code && policy.retryableErrors.includes(error.code as ErrorCode)) {
    return true;
  }
  if (
    error.statusCode &&
    policy.retryableStatusCodes.includes(error.statusCode)
  ) {
    return true;
  }
  // Connection errors
  if (
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ECONNRESET"
  ) {
    return true;
  }
  return false;
}

// =============================================================================
// CIRCUIT BREAKER PATTERN
// =============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number; // Jumlah failure sebelum circuit open
  resetTimeout: number; // Waktu sebelum mencoba lagi (ms)
  halfOpenRequests: number; // Requests yang diizinkan saat half-open
}

export interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failures: number;
  successes: number;
  lastFailure?: Date;
  nextAttempt?: Date;
}

export const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 menit
  halfOpenRequests: 3,
};

// =============================================================================
// RATE LIMITING
// =============================================================================

export interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
  strategy: "fixed" | "sliding"; // Window strategy
}

export interface RateLimitState {
  requests: number;
  windowStart: Date;
  blocked: boolean;
  resetAt: Date;
}

export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 menit
  strategy: "sliding",
};

// =============================================================================
// PROTOCOL EVENT TYPES
// =============================================================================

export type ProtocolEvent =
  | "timeout"
  | "retry"
  | "circuit_open"
  | "circuit_close"
  | "rate_limited"
  | "error"
  | "success";

export interface ProtocolEventData {
  event: ProtocolEvent;
  timestamp: number;
  context: {
    operation: string;
    attempt?: number;
    duration?: number;
    error?: string;
    [key: string]: any;
  };
}

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default {
  timeouts: defaultTimeouts,
  retryPolicies: {
    http: defaultHttpRetryPolicy,
    message: defaultMessageRetryPolicy,
    connection: defaultConnectionRetryPolicy,
  },
  circuitBreaker: defaultCircuitBreakerConfig,
  rateLimit: defaultRateLimitConfig,
  utils: {
    calculateBackoffDelay,
    isRetryableError,
  },
} as const;
