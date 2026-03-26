# Retry & Reconnect Policy

Dokumen ini mendefinisikan semua policy retry dan reconnect untuk WhatsApp SLA Application dengan Baileys library.

## Overview

```
+------------------+     +------------------+     +------------------+
|   Application    |---->|  Retry Manager   |---->|    WhatsApp      |
|                  |<----|  (All Policies)  |<----|    Server        |
+------------------+     +------------------+     +------------------+
                                |
                                v
                    +------------------------+
                    |   Policy Definitions   |
                    |------------------------|
                    | - Reconnect Policy     |
                    | - Message Retry Policy |
                    | - Auth Retry Policy    |
                    | - Circuit Breaker      |
                    | - Rate Limiter         |
                    +------------------------+
```

---

## 1. Reconnect Policy

Policy untuk menangani koneksi yang terputus ke WhatsApp server.

### Configuration

```typescript
interface ReconnectPolicy {
  maxAttempts: number;        // 10
  initialDelayMs: number;     // 1000ms
  maxDelayMs: number;         // 60000ms (1 menit)
  backoffMultiplier: number;  // 2
  jitterRangeMs: number;      // 0-500ms
  resetAfterMs: number;       // 300000ms (5 menit)
}

const RECONNECT_POLICY: ReconnectPolicy = {
  maxAttempts: 10,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitterRangeMs: 500,
  resetAfterMs: 300000,
};
```

### Delay Progression

| Attempt | Base Delay | With Jitter (max) |
|---------|------------|-------------------|
| 1       | 1,000ms    | 1,500ms           |
| 2       | 2,000ms    | 2,500ms           |
| 3       | 4,000ms    | 4,500ms           |
| 4       | 8,000ms    | 8,500ms           |
| 5       | 16,000ms   | 16,500ms          |
| 6       | 32,000ms   | 32,500ms          |
| 7       | 60,000ms   | 60,500ms (capped) |
| 8       | 60,000ms   | 60,500ms (capped) |
| 9       | 60,000ms   | 60,500ms (capped) |
| 10      | 60,000ms   | 60,500ms (capped) |

### Pseudocode Implementation

```typescript
class ReconnectManager {
  private attempts: number = 0;
  private lastSuccessfulConnection: number = 0;
  private isReconnecting: boolean = false;

  constructor(private policy: ReconnectPolicy) {}

  /**
   * Calculate delay dengan exponential backoff + jitter
   */
  private calculateDelay(): number {
    const baseDelay = Math.min(
      this.policy.initialDelayMs * Math.pow(this.policy.backoffMultiplier, this.attempts - 1),
      this.policy.maxDelayMs
    );

    // Add random jitter untuk menghindari thundering herd
    const jitter = Math.random() * this.policy.jitterRangeMs;

    return baseDelay + jitter;
  }

  /**
   * Check apakah counter harus di-reset
   * Reset jika sudah terkoneksi lebih dari resetAfterMs
   */
  private shouldResetCounter(): boolean {
    const now = Date.now();
    return (now - this.lastSuccessfulConnection) >= this.policy.resetAfterMs;
  }

  /**
   * Main reconnect logic
   */
  async reconnect(connectFn: () => Promise<void>): Promise<boolean> {
    if (this.isReconnecting) {
      console.log('[Reconnect] Already reconnecting, skipping...');
      return false;
    }

    // Reset counter jika koneksi sudah stabil sebelumnya
    if (this.shouldResetCounter() && this.attempts > 0) {
      console.log('[Reconnect] Resetting attempt counter after stable connection');
      this.attempts = 0;
    }

    this.isReconnecting = true;

    while (this.attempts < this.policy.maxAttempts) {
      this.attempts++;

      console.log(`[Reconnect] Attempt ${this.attempts}/${this.policy.maxAttempts}`);

      try {
        await connectFn();

        // Success - reset state
        this.lastSuccessfulConnection = Date.now();
        this.isReconnecting = false;
        console.log('[Reconnect] Connection successful');

        return true;
      } catch (error) {
        console.error(`[Reconnect] Attempt ${this.attempts} failed:`, error.message);

        if (this.attempts >= this.policy.maxAttempts) {
          break;
        }

        const delay = this.calculateDelay();
        console.log(`[Reconnect] Waiting ${delay}ms before next attempt...`);

        await this.sleep(delay);
      }
    }

    this.isReconnecting = false;
    console.error('[Reconnect] Max attempts reached, giving up');

    // Emit event untuk notifikasi admin
    this.emitMaxAttemptsReached();

    return false;
  }

  /**
   * Force reset state (untuk manual intervention)
   */
  reset(): void {
    this.attempts = 0;
    this.isReconnecting = false;
    console.log('[Reconnect] State reset manually');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private emitMaxAttemptsReached(): void {
    // Implementasi notifikasi ke admin
    // Bisa via webhook, email, atau Telegram
  }
}
```

### State Diagram

```
                    ┌──────────────┐
                    │  CONNECTED   │
                    │   (stable)   │
                    └──────┬───────┘
                           │
                    disconnect event
                           │
                           v
                    ┌──────────────┐
        ┌──────────>│ RECONNECTING │<──────────┐
        │           └──────┬───────┘           │
        │                  │                   │
        │           attempt connect            │
        │                  │                   │
        │          ┌───────┴───────┐           │
        │          │               │           │
        │       success          fail          │
        │          │               │           │
        │          v               v           │
        │   ┌──────────┐    ┌───────────┐      │
        │   │CONNECTED │    │   WAIT    │──────┘
        │   └──────────┘    │(backoff)  │  (if attempts < max)
        │                   └─────┬─────┘
        │                         │
        │                  attempts >= max
        │                         │
        │                         v
        │                  ┌──────────────┐
        └──────────────────│   FAILED     │
          (manual reset)   │ (give up)    │
                           └──────────────┘
```

---

## 2. Message Retry Policy

Policy untuk menangani kegagalan pengiriman pesan.

### Configuration

```typescript
interface MessageRetryPolicy {
  maxAttempts: number;        // 3
  initialDelayMs: number;     // 500ms
  backoffMultiplier: number;  // 2
  failedQueueName: string;    // 'failed_messages'
  retryableErrors: string[];  // Error codes yang bisa di-retry
}

const MESSAGE_RETRY_POLICY: MessageRetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  failedQueueName: 'failed_messages',
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVER_ERROR',
    'RATE_LIMITED',
    'CONNECTION_CLOSED',
  ],
};
```

### Non-Retryable Errors

Error berikut TIDAK akan di-retry:
- `INVALID_NUMBER` - Nomor tidak valid
- `NUMBER_NOT_REGISTERED` - Nomor tidak terdaftar di WhatsApp
- `BLOCKED` - Akun di-block oleh penerima
- `MESSAGE_TOO_LONG` - Pesan melebihi batas karakter
- `INVALID_MEDIA` - File media tidak valid

### Delay Progression

| Attempt | Delay    |
|---------|----------|
| 1       | 500ms    |
| 2       | 1,000ms  |
| 3       | 2,000ms  |
| Give up | -> Queue |

### Pseudocode Implementation

```typescript
interface Message {
  id: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'video';
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
  };
}

interface FailedMessage extends Message {
  attempts: number;
  lastError: string;
  failedAt: Date;
  originalQueuedAt: Date;
}

class MessageRetryManager {
  private failedQueue: FailedMessage[] = [];

  constructor(
    private policy: MessageRetryPolicy,
    private sendFn: (message: Message) => Promise<MessageResult>
  ) {}

  /**
   * Check apakah error bisa di-retry
   */
  private isRetryableError(errorCode: string): boolean {
    return this.policy.retryableErrors.includes(errorCode);
  }

  /**
   * Calculate delay untuk attempt tertentu
   */
  private calculateDelay(attempt: number): number {
    return this.policy.initialDelayMs * Math.pow(this.policy.backoffMultiplier, attempt - 1);
  }

  /**
   * Main send with retry logic
   */
  async sendWithRetry(message: Message): Promise<MessageResult> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= this.policy.maxAttempts; attempt++) {
      console.log(`[MessageRetry] Attempt ${attempt}/${this.policy.maxAttempts} for message ${message.id}`);

      try {
        const result = await this.sendFn(message);

        if (result.success) {
          console.log(`[MessageRetry] Message ${message.id} sent successfully`);
          return result;
        }

        // Check if error is retryable
        if (!result.error || !this.isRetryableError(result.error.code)) {
          console.log(`[MessageRetry] Non-retryable error: ${result.error?.code}`);
          return result; // Return immediately, don't retry
        }

        lastError = result.error.code;

      } catch (error) {
        lastError = error.code || 'UNKNOWN_ERROR';

        if (!this.isRetryableError(lastError)) {
          console.log(`[MessageRetry] Non-retryable exception: ${lastError}`);
          throw error;
        }
      }

      // Wait before next attempt (except on last attempt)
      if (attempt < this.policy.maxAttempts) {
        const delay = this.calculateDelay(attempt);
        console.log(`[MessageRetry] Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }

    // All attempts failed - store to failed queue
    console.log(`[MessageRetry] All attempts failed for message ${message.id}, storing to failed queue`);

    this.storeToFailedQueue(message, lastError);

    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: `Failed after ${this.policy.maxAttempts} attempts. Last error: ${lastError}`,
      },
    };
  }

  /**
   * Store message ke failed queue untuk review manual atau retry later
   */
  private storeToFailedQueue(message: Message, lastError: string): void {
    const failedMessage: FailedMessage = {
      ...message,
      attempts: this.policy.maxAttempts,
      lastError,
      failedAt: new Date(),
      originalQueuedAt: new Date(), // Should come from original message
    };

    this.failedQueue.push(failedMessage);

    // Persist ke database
    this.persistToDatabase(failedMessage);

    // Emit event untuk monitoring
    this.emitFailedMessage(failedMessage);
  }

  /**
   * Retry all messages in failed queue
   */
  async retryFailedQueue(): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const messages = [...this.failedQueue];
    this.failedQueue = [];

    let success = 0;
    let failed = 0;

    for (const message of messages) {
      const result = await this.sendWithRetry(message);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return {
      total: messages.length,
      success,
      failed,
    };
  }

  /**
   * Get failed queue for inspection
   */
  getFailedQueue(): FailedMessage[] {
    return [...this.failedQueue];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async persistToDatabase(message: FailedMessage): Promise<void> {
    // Implementasi persist ke database
    // INSERT INTO failed_messages (...) VALUES (...)
  }

  private emitFailedMessage(message: FailedMessage): void {
    // Emit event untuk monitoring/alerting
  }
}
```

### Flowchart

```
                ┌─────────────┐
                │ Send Message│
                └──────┬──────┘
                       │
                       v
                ┌─────────────┐
                │  Attempt 1  │
                └──────┬──────┘
                       │
             ┌─────────┴─────────┐
             │                   │
          success             failure
             │                   │
             v                   v
       ┌──────────┐       ┌───────────────┐
       │ Complete │       │Is Retryable?  │
       └──────────┘       └───────┬───────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                        YES               NO
                         │                 │
                         v                 v
                  ┌────────────┐    ┌──────────────┐
                  │Wait 500ms  │    │Return Error  │
                  │Then Retry  │    │(Don't Retry) │
                  └─────┬──────┘    └──────────────┘
                        │
                        v
                 ┌─────────────┐
                 │  Attempt 2  │
                 └──────┬──────┘
                        │
              (repeat until max attempts)
                        │
                        v
                 ┌─────────────┐
                 │  Attempt 3  │
                 └──────┬──────┘
                        │
                     failure
                        │
                        v
                 ┌───────────────┐
                 │Store to Failed│
                 │    Queue      │
                 └───────────────┘
```

---

## 3. Auth Retry Policy

Policy untuk menangani proses autentikasi WhatsApp (QR Code atau Pairing Code).

### Configuration

```typescript
interface AuthRetryPolicy {
  qrTimeoutMs: number;        // 60000ms (60 seconds per QR)
  qrRefreshBeforeMs: number;  // 5000ms (refresh 5s before timeout)
  pairingTimeoutMs: number;   // 120000ms (120 seconds)
  maxAuthAttempts: number;    // 3 per session
  cooldownBetweenAttemptsMs: number; // 5000ms
}

const AUTH_RETRY_POLICY: AuthRetryPolicy = {
  qrTimeoutMs: 60000,
  qrRefreshBeforeMs: 5000,
  pairingTimeoutMs: 120000,
  maxAuthAttempts: 3,
  cooldownBetweenAttemptsMs: 5000,
};
```

### Pseudocode Implementation

```typescript
interface AuthState {
  status: 'idle' | 'waiting_qr' | 'waiting_pairing' | 'authenticated' | 'failed';
  qrCode?: string;
  pairingCode?: string;
  attempts: number;
  lastAttemptAt?: Date;
}

type AuthMethod = 'qr' | 'pairing_code';

class AuthRetryManager {
  private state: AuthState = {
    status: 'idle',
    attempts: 0,
  };

  private qrRefreshTimer?: NodeJS.Timeout;
  private authTimeoutTimer?: NodeJS.Timeout;

  constructor(
    private policy: AuthRetryPolicy,
    private callbacks: {
      onQRCode: (qr: string) => void;
      onPairingCode: (code: string) => void;
      onAuthenticated: () => void;
      onAuthFailed: (reason: string) => void;
    }
  ) {}

  /**
   * Start authentication process
   */
  async startAuth(
    method: AuthMethod,
    generateCredentialsFn: () => Promise<{ qr?: string; pairingCode?: string }>
  ): Promise<boolean> {
    // Check if we've exceeded max attempts
    if (this.state.attempts >= this.policy.maxAuthAttempts) {
      console.log('[Auth] Max auth attempts reached for this session');
      this.callbacks.onAuthFailed('MAX_AUTH_ATTEMPTS_EXCEEDED');
      return false;
    }

    // Cooldown between attempts
    if (this.state.lastAttemptAt) {
      const elapsed = Date.now() - this.state.lastAttemptAt.getTime();
      if (elapsed < this.policy.cooldownBetweenAttemptsMs) {
        const wait = this.policy.cooldownBetweenAttemptsMs - elapsed;
        console.log(`[Auth] Cooldown, waiting ${wait}ms...`);
        await this.sleep(wait);
      }
    }

    this.state.attempts++;
    this.state.lastAttemptAt = new Date();

    console.log(`[Auth] Starting auth attempt ${this.state.attempts}/${this.policy.maxAuthAttempts}`);

    if (method === 'qr') {
      return this.handleQRAuth(generateCredentialsFn);
    } else {
      return this.handlePairingAuth(generateCredentialsFn);
    }
  }

  /**
   * Handle QR Code authentication
   */
  private async handleQRAuth(
    generateQRFn: () => Promise<{ qr?: string }>
  ): Promise<boolean> {
    this.state.status = 'waiting_qr';

    const generateAndEmitQR = async (): Promise<void> => {
      try {
        const result = await generateQRFn();
        if (result.qr) {
          this.state.qrCode = result.qr;
          this.callbacks.onQRCode(result.qr);

          // Schedule QR refresh before timeout
          this.scheduleQRRefresh(generateAndEmitQR);
        }
      } catch (error) {
        console.error('[Auth] Failed to generate QR:', error);
      }
    };

    // Generate first QR
    await generateAndEmitQR();

    // Wait for authentication or timeout
    return new Promise((resolve) => {
      this.authTimeoutTimer = setTimeout(() => {
        if (this.state.status !== 'authenticated') {
          console.log('[Auth] QR auth timed out');
          this.cleanup();

          // Auto retry if attempts remaining
          if (this.state.attempts < this.policy.maxAuthAttempts) {
            console.log('[Auth] Auto-retrying QR auth...');
            this.handleQRAuth(generateQRFn).then(resolve);
          } else {
            this.state.status = 'failed';
            this.callbacks.onAuthFailed('QR_AUTH_TIMEOUT');
            resolve(false);
          }
        }
      }, this.policy.qrTimeoutMs);
    });
  }

  /**
   * Schedule QR refresh sebelum timeout
   */
  private scheduleQRRefresh(refreshFn: () => Promise<void>): void {
    // Clear existing timer
    if (this.qrRefreshTimer) {
      clearTimeout(this.qrRefreshTimer);
    }

    // Schedule refresh 5 seconds before QR expires
    const refreshDelay = this.policy.qrTimeoutMs - this.policy.qrRefreshBeforeMs;

    this.qrRefreshTimer = setTimeout(async () => {
      if (this.state.status === 'waiting_qr') {
        console.log('[Auth] QR about to expire, refreshing...');
        await refreshFn();
      }
    }, refreshDelay);
  }

  /**
   * Handle Pairing Code authentication
   */
  private async handlePairingAuth(
    generatePairingFn: () => Promise<{ pairingCode?: string }>
  ): Promise<boolean> {
    this.state.status = 'waiting_pairing';

    try {
      const result = await generatePairingFn();
      if (result.pairingCode) {
        this.state.pairingCode = result.pairingCode;
        this.callbacks.onPairingCode(result.pairingCode);
      }
    } catch (error) {
      console.error('[Auth] Failed to generate pairing code:', error);
      return false;
    }

    // Wait for authentication or timeout
    return new Promise((resolve) => {
      this.authTimeoutTimer = setTimeout(() => {
        if (this.state.status !== 'authenticated') {
          console.log('[Auth] Pairing auth timed out');
          this.cleanup();

          // Auto retry if attempts remaining
          if (this.state.attempts < this.policy.maxAuthAttempts) {
            console.log('[Auth] Auto-retrying pairing auth...');
            this.handlePairingAuth(generatePairingFn).then(resolve);
          } else {
            this.state.status = 'failed';
            this.callbacks.onAuthFailed('PAIRING_AUTH_TIMEOUT');
            resolve(false);
          }
        }
      }, this.policy.pairingTimeoutMs);
    });
  }

  /**
   * Call when authentication succeeds
   */
  onAuthSuccess(): void {
    console.log('[Auth] Authentication successful');
    this.state.status = 'authenticated';
    this.cleanup();
    this.callbacks.onAuthenticated();
  }

  /**
   * Reset auth state for new session
   */
  resetSession(): void {
    this.state = {
      status: 'idle',
      attempts: 0,
    };
    this.cleanup();
    console.log('[Auth] Session reset');
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  private cleanup(): void {
    if (this.qrRefreshTimer) {
      clearTimeout(this.qrRefreshTimer);
      this.qrRefreshTimer = undefined;
    }
    if (this.authTimeoutTimer) {
      clearTimeout(this.authTimeoutTimer);
      this.authTimeoutTimer = undefined;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Timeline Diagram

```
QR Authentication Flow:
═══════════════════════════════════════════════════════════════════

Time: 0s                            55s     60s
      │                              │       │
      │<────── QR Code #1 ──────────>│       │
      │                              │       │
      ▼                              ▼       ▼
Generate QR ──────────────────> Refresh ──> Timeout
      │                              │       │
      │                              │       │
      │<───────── QR Code #2 ────────┼──────>│
      │                              │       │
                                            │
                                    Attempt #2 starts
                                            │
                                            ▼


Pairing Code Authentication Flow:
═══════════════════════════════════════════════════════════════════

Time: 0s                                            120s
      │                                              │
      │<────────── Pairing Code Valid ──────────────>│
      │                                              │
      ▼                                              ▼
Generate Code ──────────────────────────────────> Timeout
      │                                              │
      │                                              │
      User enters code in                    Attempt #2 starts
      WhatsApp app                                   │
            │                                        ▼
            ▼
      Authenticated!
```

---

## 4. Circuit Breaker Policy

Policy untuk melindungi sistem dari cascading failures.

### Configuration

```typescript
interface CircuitBreakerPolicy {
  failureThreshold: number;    // 5 consecutive failures
  successThreshold: number;    // 2 successful requests to close
  halfOpenDelayMs: number;     // 30000ms (30 seconds)
  monitoringWindowMs: number;  // 60000ms (1 minute)
}

const CIRCUIT_BREAKER_POLICY: CircuitBreakerPolicy = {
  failureThreshold: 5,
  successThreshold: 2,
  halfOpenDelayMs: 30000,
  monitoringWindowMs: 60000,
};
```

### States

1. **CLOSED** - Normal operation, requests flow through
2. **OPEN** - Circuit tripped, requests fail immediately
3. **HALF_OPEN** - Testing if service recovered

### Pseudocode Implementation

```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStats {
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureAt?: Date;
  lastStateChange: Date;
  totalRequests: number;
  totalFailures: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private stats: CircuitStats = {
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    lastStateChange: new Date(),
    totalRequests: 0,
    totalFailures: 0,
  };
  private halfOpenTimer?: NodeJS.Timeout;

  constructor(
    private name: string,
    private policy: CircuitBreakerPolicy
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalRequests++;

    // Check if circuit is OPEN
    if (this.state === 'OPEN') {
      const shouldTryHalfOpen = this.shouldTransitionToHalfOpen();

      if (!shouldTryHalfOpen) {
        console.log(`[CircuitBreaker:${this.name}] Circuit is OPEN, rejecting request`);
        throw new CircuitOpenError(`Circuit breaker ${this.name} is OPEN`);
      }

      // Transition to HALF_OPEN
      this.transitionTo('HALF_OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  private onSuccess(): void {
    this.stats.consecutiveFailures = 0;
    this.stats.consecutiveSuccesses++;

    console.log(`[CircuitBreaker:${this.name}] Success. Consecutive: ${this.stats.consecutiveSuccesses}`);

    if (this.state === 'HALF_OPEN') {
      if (this.stats.consecutiveSuccesses >= this.policy.successThreshold) {
        console.log(`[CircuitBreaker:${this.name}] Success threshold reached, closing circuit`);
        this.transitionTo('CLOSED');
      }
    }
  }

  /**
   * Record failed execution
   */
  private onFailure(): void {
    this.stats.consecutiveSuccesses = 0;
    this.stats.consecutiveFailures++;
    this.stats.totalFailures++;
    this.stats.lastFailureAt = new Date();

    console.log(`[CircuitBreaker:${this.name}] Failure. Consecutive: ${this.stats.consecutiveFailures}`);

    // Open circuit if threshold reached
    if (this.stats.consecutiveFailures >= this.policy.failureThreshold) {
      if (this.state !== 'OPEN') {
        console.log(`[CircuitBreaker:${this.name}] Failure threshold reached, opening circuit`);
        this.transitionTo('OPEN');
      }
    }

    // If in HALF_OPEN, any failure opens the circuit again
    if (this.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker:${this.name}] Failure in HALF_OPEN state, reopening circuit`);
      this.transitionTo('OPEN');
    }
  }

  /**
   * Check if should transition from OPEN to HALF_OPEN
   */
  private shouldTransitionToHalfOpen(): boolean {
    const elapsed = Date.now() - this.stats.lastStateChange.getTime();
    return elapsed >= this.policy.halfOpenDelayMs;
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;
    this.stats.lastStateChange = new Date();

    if (newState === 'CLOSED') {
      this.stats.consecutiveFailures = 0;
      this.stats.consecutiveSuccesses = 0;
    }

    if (newState === 'HALF_OPEN') {
      this.stats.consecutiveSuccesses = 0;
    }

    console.log(`[CircuitBreaker:${this.name}] State transition: ${previousState} -> ${newState}`);

    // Emit event for monitoring
    this.emitStateChange(previousState, newState);
  }

  /**
   * Get current state and stats
   */
  getStatus(): { state: CircuitState; stats: CircuitStats } {
    return {
      state: this.state,
      stats: { ...this.stats },
    };
  }

  /**
   * Force reset circuit to CLOSED
   */
  reset(): void {
    this.transitionTo('CLOSED');
    this.stats = {
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastStateChange: new Date(),
      totalRequests: 0,
      totalFailures: 0,
    };
    console.log(`[CircuitBreaker:${this.name}] Circuit manually reset`);
  }

  private emitStateChange(from: CircuitState, to: CircuitState): void {
    // Emit event for monitoring/alerting
  }
}

class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}
```

### State Diagram

```
                          ┌─────────────────────────────────────────┐
                          │                                         │
                          │             success threshold           │
                          │               reached (2)               │
                          │                                         │
                          ▼                                         │
                    ┌──────────┐                              ┌─────┴─────┐
       ────────────>│  CLOSED  │                              │ HALF_OPEN │
                    └────┬─────┘                              └─────┬─────┘
                         │                                          │
                         │ 5 consecutive                            │
                         │ failures                                 │ any failure
                         │                                          │
                         ▼                                          │
                    ┌──────────┐                                    │
                    │   OPEN   │<───────────────────────────────────┘
                    └────┬─────┘
                         │
                         │ 30 seconds
                         │ passed
                         │
                         ▼
                    ┌──────────┐
                    │HALF_OPEN │ (allow 1 test request)
                    └──────────┘
```

### Integration Example

```typescript
// Usage dengan WhatsApp connection
const waCircuitBreaker = new CircuitBreaker('whatsapp', CIRCUIT_BREAKER_POLICY);

async function sendMessage(to: string, content: string): Promise<void> {
  return waCircuitBreaker.execute(async () => {
    return await sock.sendMessage(to, { text: content });
  });
}

// Usage dengan external API
const apiCircuitBreaker = new CircuitBreaker('external-api', CIRCUIT_BREAKER_POLICY);

async function callExternalAPI(endpoint: string): Promise<any> {
  return apiCircuitBreaker.execute(async () => {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  });
}
```

---

## 5. Rate Limiting Policy

Policy untuk mengontrol rate pengiriman pesan dan API calls.

### Configuration

```typescript
interface RateLimitPolicy {
  // Message rate limits
  messagesPerSecond: number;          // 1 (WhatsApp recommendation)
  messagesPerMinute: number;          // 30
  messagesPerHour: number;            // 1000

  // API rate limits
  apiCallsPerMinute: number;          // 60
  apiCallsPerHour: number;            // 1000

  // Burst handling
  burstSize: number;                  // 5 (allow short bursts)
  burstRefillRateMs: number;          // 1000 (1 token per second)

  // Cooldown on rate limit hit
  rateLimitCooldownMs: number;        // 60000 (1 minute)
}

const RATE_LIMIT_POLICY: RateLimitPolicy = {
  messagesPerSecond: 1,
  messagesPerMinute: 30,
  messagesPerHour: 1000,
  apiCallsPerMinute: 60,
  apiCallsPerHour: 1000,
  burstSize: 5,
  burstRefillRateMs: 1000,
  rateLimitCooldownMs: 60000,
};
```

### Pseudocode Implementation

```typescript
interface RateLimitWindow {
  count: number;
  windowStart: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private windows: Map<string, RateLimitWindow> = new Map();
  private bucket: TokenBucket;
  private queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private isProcessingQueue: boolean = false;
  private isCoolingDown: boolean = false;

  constructor(private policy: RateLimitPolicy) {
    this.bucket = {
      tokens: policy.burstSize,
      lastRefill: Date.now(),
    };
  }

  /**
   * Token Bucket Algorithm untuk burst control
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.policy.burstRefillRateMs);

    if (tokensToAdd > 0) {
      this.bucket.tokens = Math.min(
        this.policy.burstSize,
        this.bucket.tokens + tokensToAdd
      );
      this.bucket.lastRefill = now;
    }
  }

  /**
   * Check sliding window rate limit
   */
  private checkWindowLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const window = this.windows.get(key);

    if (!window || (now - window.windowStart) >= windowMs) {
      // New window
      this.windows.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (window.count >= limit) {
      return false; // Rate limited
    }

    window.count++;
    return true;
  }

  /**
   * Main rate limit check
   */
  async acquire(type: 'message' | 'api'): Promise<boolean> {
    // Check cooldown
    if (this.isCoolingDown) {
      console.log('[RateLimiter] In cooldown period, queuing request');
      return false;
    }

    // Refill tokens
    this.refillTokens();

    // Check token bucket (burst)
    if (this.bucket.tokens <= 0) {
      console.log('[RateLimiter] Token bucket empty, no burst available');
      return false;
    }

    // Check window limits based on type
    if (type === 'message') {
      const canSendPerSecond = this.checkWindowLimit(
        'msg_second',
        this.policy.messagesPerSecond,
        1000
      );
      const canSendPerMinute = this.checkWindowLimit(
        'msg_minute',
        this.policy.messagesPerMinute,
        60000
      );
      const canSendPerHour = this.checkWindowLimit(
        'msg_hour',
        this.policy.messagesPerHour,
        3600000
      );

      if (!canSendPerSecond || !canSendPerMinute || !canSendPerHour) {
        console.log('[RateLimiter] Message rate limit exceeded');
        return false;
      }
    } else {
      const canCallPerMinute = this.checkWindowLimit(
        'api_minute',
        this.policy.apiCallsPerMinute,
        60000
      );
      const canCallPerHour = this.checkWindowLimit(
        'api_hour',
        this.policy.apiCallsPerHour,
        3600000
      );

      if (!canCallPerMinute || !canCallPerHour) {
        console.log('[RateLimiter] API rate limit exceeded');
        return false;
      }
    }

    // Consume a token
    this.bucket.tokens--;
    return true;
  }

  /**
   * Execute with rate limiting
   */
  async execute<T>(type: 'message' | 'api', fn: () => Promise<T>): Promise<T> {
    // Try to acquire immediately
    const canProceed = await this.acquire(type);

    if (canProceed) {
      return this.executeWithTracking(fn);
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      console.log(`[RateLimiter] Request queued. Queue size: ${this.queue.length}`);
      this.processQueue(type);
    });
  }

  /**
   * Execute function with rate limit tracking
   */
  private async executeWithTracking<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      // Check if we got rate limited by WhatsApp
      if (this.isRateLimitError(error)) {
        console.log('[RateLimiter] Received rate limit from WhatsApp, entering cooldown');
        this.startCooldown();
      }
      throw error;
    }
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    const rateLimitCodes = [
      'rate-overlimit',
      '429',
      'RATE_LIMITED',
      'too_many_requests',
    ];

    return rateLimitCodes.some(code =>
      error.message?.includes(code) ||
      error.code?.includes(code)
    );
  }

  /**
   * Start cooldown period
   */
  private startCooldown(): void {
    this.isCoolingDown = true;

    setTimeout(() => {
      this.isCoolingDown = false;
      console.log('[RateLimiter] Cooldown ended, resuming operations');
      this.processQueue('message'); // Resume queue processing
    }, this.policy.rateLimitCooldownMs);
  }

  /**
   * Process queued requests
   */
  private async processQueue(type: 'message' | 'api'): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      // Wait for rate limit window
      const canProceed = await this.acquire(type);

      if (!canProceed) {
        // Wait a bit and try again
        await this.sleep(this.policy.burstRefillRateMs);
        continue;
      }

      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await this.executeWithTracking(item.fn);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    tokensAvailable: number;
    queueSize: number;
    isCoolingDown: boolean;
    windows: Record<string, RateLimitWindow>;
  } {
    this.refillTokens();

    return {
      tokensAvailable: this.bucket.tokens,
      queueSize: this.queue.length,
      isCoolingDown: this.isCoolingDown,
      windows: Object.fromEntries(this.windows),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Rate Limit Visualization

```
Token Bucket Algorithm:
═══════════════════════════════════════════════════════════════════

Bucket Capacity: 5 tokens
Refill Rate: 1 token/second

Time  0s   1s   2s   3s   4s   5s   6s   7s   8s   9s
      │    │    │    │    │    │    │    │    │    │
Tokens: [5]  [5]  [4]  [3]  [2]  [3]  [4]  [5]  [5]  [4]
            │    │    │    │    │    │    │
           Send Send Send  │   Send Send  │  Send
                          Refill    Refill


Sliding Window (Messages per Minute):
═══════════════════════════════════════════════════════════════════

Limit: 30 messages per minute

Window: |<──────────── 60 seconds ────────────>|

        ████████████████░░░░░░░░░░░░░░░░░░░░░░░
        |    28/30    |     Window slides...

        As window slides, old messages fall out of the window
        allowing new messages to be sent.
```

---

## 6. Unified Retry Manager

Class yang mengintegrasikan semua policies.

```typescript
interface RetryManagerConfig {
  reconnect: ReconnectPolicy;
  message: MessageRetryPolicy;
  auth: AuthRetryPolicy;
  circuitBreaker: CircuitBreakerPolicy;
  rateLimit: RateLimitPolicy;
}

class UnifiedRetryManager {
  private reconnectManager: ReconnectManager;
  private messageRetryManager: MessageRetryManager;
  private authManager: AuthRetryManager;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;

  constructor(config: RetryManagerConfig) {
    this.reconnectManager = new ReconnectManager(config.reconnect);
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.circuitBreaker = new CircuitBreaker('whatsapp', config.circuitBreaker);

    // Message retry dengan rate limiting
    this.messageRetryManager = new MessageRetryManager(
      config.message,
      async (message) => {
        return this.rateLimiter.execute('message', async () => {
          return this.circuitBreaker.execute(async () => {
            // Actual send implementation
            return this.sendMessageImpl(message);
          });
        });
      }
    );

    this.authManager = new AuthRetryManager(config.auth, {
      onQRCode: (qr) => this.handleQRCode(qr),
      onPairingCode: (code) => this.handlePairingCode(code),
      onAuthenticated: () => this.handleAuthenticated(),
      onAuthFailed: (reason) => this.handleAuthFailed(reason),
    });
  }

  /**
   * Send message dengan semua protections
   */
  async sendMessage(message: Message): Promise<MessageResult> {
    return this.messageRetryManager.sendWithRetry(message);
  }

  /**
   * Reconnect dengan backoff
   */
  async reconnect(connectFn: () => Promise<void>): Promise<boolean> {
    return this.reconnectManager.reconnect(connectFn);
  }

  /**
   * Start authentication
   */
  async authenticate(
    method: AuthMethod,
    generateFn: () => Promise<{ qr?: string; pairingCode?: string }>
  ): Promise<boolean> {
    return this.authManager.startAuth(method, generateFn);
  }

  /**
   * Get comprehensive status
   */
  getStatus(): {
    circuitBreaker: { state: CircuitState; stats: CircuitStats };
    rateLimit: ReturnType<RateLimiter['getStatus']>;
    failedMessages: FailedMessage[];
    authState: AuthState;
  } {
    return {
      circuitBreaker: this.circuitBreaker.getStatus(),
      rateLimit: this.rateLimiter.getStatus(),
      failedMessages: this.messageRetryManager.getFailedQueue(),
      authState: this.authManager.getState(),
    };
  }

  // Private implementation methods...
  private async sendMessageImpl(message: Message): Promise<MessageResult> {
    // Actual WhatsApp send implementation
  }

  private handleQRCode(qr: string): void {
    // Emit QR code to client
  }

  private handlePairingCode(code: string): void {
    // Emit pairing code to client
  }

  private handleAuthenticated(): void {
    // Handle successful auth
  }

  private handleAuthFailed(reason: string): void {
    // Handle auth failure
  }
}
```

---

## 7. Default Configurations

### Development Environment

```typescript
const DEV_CONFIG: RetryManagerConfig = {
  reconnect: {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterRangeMs: 200,
    resetAfterMs: 60000,
  },
  message: {
    maxAttempts: 2,
    initialDelayMs: 200,
    backoffMultiplier: 2,
    failedQueueName: 'failed_messages_dev',
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'],
  },
  auth: {
    qrTimeoutMs: 120000, // Longer for dev
    qrRefreshBeforeMs: 10000,
    pairingTimeoutMs: 300000,
    maxAuthAttempts: 5,
    cooldownBetweenAttemptsMs: 2000,
  },
  circuitBreaker: {
    failureThreshold: 10,
    successThreshold: 1,
    halfOpenDelayMs: 10000,
    monitoringWindowMs: 60000,
  },
  rateLimit: {
    messagesPerSecond: 5, // Less strict for dev
    messagesPerMinute: 100,
    messagesPerHour: 5000,
    apiCallsPerMinute: 100,
    apiCallsPerHour: 5000,
    burstSize: 10,
    burstRefillRateMs: 500,
    rateLimitCooldownMs: 10000,
  },
};
```

### Production Environment

```typescript
const PROD_CONFIG: RetryManagerConfig = {
  reconnect: {
    maxAttempts: 10,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    jitterRangeMs: 500,
    resetAfterMs: 300000, // 5 minutes
  },
  message: {
    maxAttempts: 3,
    initialDelayMs: 500,
    backoffMultiplier: 2,
    failedQueueName: 'failed_messages',
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'RATE_LIMITED',
      'CONNECTION_CLOSED',
    ],
  },
  auth: {
    qrTimeoutMs: 60000,
    qrRefreshBeforeMs: 5000,
    pairingTimeoutMs: 120000,
    maxAuthAttempts: 3,
    cooldownBetweenAttemptsMs: 5000,
  },
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 2,
    halfOpenDelayMs: 30000,
    monitoringWindowMs: 60000,
  },
  rateLimit: {
    messagesPerSecond: 1,
    messagesPerMinute: 30,
    messagesPerHour: 1000,
    apiCallsPerMinute: 60,
    apiCallsPerHour: 1000,
    burstSize: 5,
    burstRefillRateMs: 1000,
    rateLimitCooldownMs: 60000,
  },
};
```

---

## 8. Monitoring & Alerting

### Metrics to Track

```typescript
interface RetryMetrics {
  // Reconnect metrics
  reconnect_attempts_total: Counter;
  reconnect_success_total: Counter;
  reconnect_failure_total: Counter;
  reconnect_duration_seconds: Histogram;

  // Message retry metrics
  message_retry_attempts_total: Counter;
  message_retry_success_total: Counter;
  message_failed_queue_size: Gauge;
  message_send_duration_seconds: Histogram;

  // Circuit breaker metrics
  circuit_breaker_state: Gauge; // 0=closed, 1=open, 2=half-open
  circuit_breaker_trips_total: Counter;

  // Rate limiter metrics
  rate_limit_tokens_available: Gauge;
  rate_limit_queue_size: Gauge;
  rate_limit_rejections_total: Counter;

  // Auth metrics
  auth_attempts_total: Counter;
  auth_success_total: Counter;
  auth_timeout_total: Counter;
}
```

### Alert Rules

```yaml
# Prometheus alerting rules
groups:
  - name: whatsapp_retry_alerts
    rules:
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "WhatsApp circuit breaker is OPEN"
          description: "Circuit breaker has been open for more than 1 minute"

      - alert: HighMessageFailureRate
        expr: rate(message_retry_failure_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High message failure rate"
          description: "More than 10% of messages failing in the last 5 minutes"

      - alert: ReconnectLoopDetected
        expr: increase(reconnect_attempts_total[10m]) > 20
        labels:
          severity: critical
        annotations:
          summary: "Reconnect loop detected"
          description: "More than 20 reconnect attempts in 10 minutes"

      - alert: FailedQueueGrowing
        expr: message_failed_queue_size > 100
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Failed message queue is growing"
          description: "More than 100 messages in failed queue"
```

---

## Summary

| Policy            | Key Parameters                                        | Trigger Condition                |
|-------------------|-------------------------------------------------------|----------------------------------|
| **Reconnect**     | Max 10 attempts, 1s-60s delay, 2x backoff            | Connection lost                  |
| **Message Retry** | Max 3 attempts, 500ms-2s delay, 2x backoff           | Retryable error on send          |
| **Auth Retry**    | QR: 60s timeout, Pairing: 120s, Max 3 attempts       | Auth timeout or failure          |
| **Circuit Breaker**| Open after 5 failures, Half-open after 30s           | 5 consecutive failures           |
| **Rate Limiter**  | 1 msg/s, 30 msg/min, 1000 msg/hr, burst: 5           | Rate limit threshold reached     |

Semua policy bekerja bersama untuk memastikan:
1. Koneksi yang resilient dengan reconnect yang cerdas
2. Pesan tidak hilang dengan retry dan failed queue
3. Auth yang user-friendly dengan auto-refresh QR
4. Perlindungan dari cascading failure dengan circuit breaker
5. Compliance dengan WhatsApp rate limits
