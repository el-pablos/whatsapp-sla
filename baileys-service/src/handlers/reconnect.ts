import { DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

/**
 * ReconnectHandler - Menangani strategi reconnect yang robust untuk Baileys
 *
 * Features:
 * - Exponential backoff dengan jitter
 * - Max reconnect attempts
 * - Smart disconnect reason detection
 * - Connection health tracking
 */
export class ReconnectHandler {
  private reconnectAttempts: number = 0;
  private maxAttempts: number = 10;
  private baseDelay: number = 1000; // 1 detik
  private maxDelay: number = 60000; // 60 detik
  private lastSuccessfulConnection: Date | null = null;
  private connectionHistory: Date[] = [];

  constructor(options?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  }) {
    if (options?.maxAttempts) this.maxAttempts = options.maxAttempts;
    if (options?.baseDelay) this.baseDelay = options.baseDelay;
    if (options?.maxDelay) this.maxDelay = options.maxDelay;
  }

  /**
   * Determine if should reconnect based on disconnect reason
   *
   * @param reason - DisconnectReason dari Baileys
   * @returns boolean - true jika harus reconnect
   */
  shouldReconnect(reason: DisconnectReason): boolean {
    // Reasons yang HARUS reconnect
    const shouldReconnectReasons = [
      DisconnectReason.connectionClosed,
      DisconnectReason.connectionLost,
      DisconnectReason.timedOut,
      DisconnectReason.restartRequired,
      DisconnectReason.connectionReplaced,
    ];

    // Reasons yang JANGAN reconnect (permanent failures)
    const permanentFailureReasons = [
      DisconnectReason.loggedOut,
      DisconnectReason.badSession,
      DisconnectReason.forbidden,
      DisconnectReason.unavailableService,
    ];

    if (permanentFailureReasons.includes(reason)) {
      console.log(
        `[ReconnectHandler] Permanent failure detected: ${reason}. Not reconnecting.`,
      );
      return false;
    }

    if (shouldReconnectReasons.includes(reason)) {
      console.log(`[ReconnectHandler] Reconnectable reason: ${reason}`);
      return true;
    }

    // Default: reconnect untuk reason yang tidak dikenal
    console.log(
      `[ReconnectHandler] Unknown disconnect reason: ${reason}. Will attempt reconnect.`,
    );
    return true;
  }

  /**
   * Calculate delay dengan exponential backoff + jitter
   *
   * Formula: min(baseDelay * 2^attempts, maxDelay) + random(0-500)ms
   *
   * @returns delay dalam milliseconds
   */
  calculateDelay(): number {
    const exponential = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay,
    );

    // Jitter untuk menghindari thundering herd
    const jitter = Math.random() * 500;

    const totalDelay = exponential + jitter;

    console.log(
      `[ReconnectHandler] Calculated delay: ${totalDelay.toFixed(0)}ms ` +
        `(attempt ${this.reconnectAttempts + 1}/${this.maxAttempts})`,
    );

    return totalDelay;
  }

  /**
   * Execute reconnect dengan exponential backoff
   *
   * @param initSocket - Callback function untuk initialize socket
   * @throws Error jika max attempts tercapai
   */
  async reconnect(initSocket: () => Promise<void>): Promise<void> {
    if (this.reconnectAttempts >= this.maxAttempts) {
      const error = new Error(
        `Max reconnect attempts (${this.maxAttempts}) reached. Giving up.`,
      );
      console.error(`[ReconnectHandler] ${error.message}`);
      throw error;
    }

    this.reconnectAttempts++;
    const delay = this.calculateDelay();

    console.log(
      `[ReconnectHandler] Attempting reconnect ${this.reconnectAttempts}/${this.maxAttempts} ` +
        `in ${(delay / 1000).toFixed(1)}s...`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await initSocket();
      console.log("[ReconnectHandler] Reconnect successful");
    } catch (error) {
      console.error("[ReconnectHandler] Reconnect attempt failed:", error);
      throw error;
    }
  }

  /**
   * Reset counter on successful connection
   * Dipanggil setelah connection.update dengan isNewLogin atau connection open
   */
  resetOnSuccess(): void {
    console.log(
      `[ReconnectHandler] Connection successful. Resetting counter from ${this.reconnectAttempts} attempts.`,
    );

    this.reconnectAttempts = 0;
    this.lastSuccessfulConnection = new Date();
    this.connectionHistory.push(new Date());

    // Keep only last 10 connections in history
    if (this.connectionHistory.length > 10) {
      this.connectionHistory.shift();
    }
  }

  /**
   * Get reconnect statistics
   *
   * @returns Object dengan stats
   */
  getStats() {
    return {
      currentAttempts: this.reconnectAttempts,
      maxAttempts: this.maxAttempts,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      connectionHistory: this.connectionHistory,
      attemptsRemaining: this.maxAttempts - this.reconnectAttempts,
    };
  }

  /**
   * Check if connection is healthy based on history
   *
   * @returns boolean - false jika terlalu sering disconnect
   */
  isConnectionHealthy(): boolean {
    if (this.connectionHistory.length < 5) {
      return true; // Not enough data
    }

    // Check apakah ada 5+ disconnects dalam 5 menit terakhir
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentConnections = this.connectionHistory.filter(
      (date) => date > fiveMinutesAgo,
    );

    if (recentConnections.length >= 5) {
      console.warn(
        `[ReconnectHandler] Connection unstable: ${recentConnections.length} reconnects in last 5 minutes`,
      );
      return false;
    }

    return true;
  }

  /**
   * Reset all state (untuk testing atau manual reset)
   */
  reset(): void {
    console.log("[ReconnectHandler] Manual reset triggered");
    this.reconnectAttempts = 0;
    this.lastSuccessfulConnection = null;
    this.connectionHistory = [];
  }

  /**
   * Parse Boom error untuk mendapatkan DisconnectReason
   *
   * @param error - Error object dari Baileys
   * @returns DisconnectReason atau null
   */
  static parseDisconnectReason(error: any): DisconnectReason | null {
    if (error instanceof Boom) {
      const statusCode = error.output?.statusCode;
      return statusCode as DisconnectReason;
    }

    // Try to extract from error structure
    if (error?.output?.statusCode) {
      return error.output.statusCode as DisconnectReason;
    }

    return null;
  }
}
