import QRCode from "qrcode";
import { EventEmitter } from "events";

export interface QROptions {
  /** Timeout dalam milidetik sebelum QR dianggap expired (default: 30000) */
  timeout?: number;
  /** Maksimum jumlah QR yang bisa di-generate sebelum fail (default: 5) */
  maxRetries?: number;
  /** Callback untuk logging */
  logger?: (level: "info" | "warn" | "error", message: string) => void;
}

export interface QRData {
  /** Raw QR string dari Baileys */
  raw: string;
  /** Base64 encoded PNG image */
  base64?: string;
  /** Terminal-friendly string representation */
  terminal?: string;
  /** Timestamp ketika QR di-generate */
  generatedAt: number;
  /** Timestamp ketika QR akan expire */
  expiresAt: number;
  /** Nomor attempt saat ini */
  attempt: number;
}

export interface QREvents {
  "qr:generated": (data: QRData) => void;
  "qr:expired": (attempt: number) => void;
  "qr:max-retries": () => void;
  "qr:cleared": () => void;
}

export class QRHandler extends EventEmitter {
  private qrTimeout: NodeJS.Timeout | null = null;
  private currentQR: QRData | null = null;
  private attemptCount: number = 0;
  private isAuthenticated: boolean = false;

  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly logger: (
    level: "info" | "warn" | "error",
    message: string,
  ) => void;

  constructor(options: QROptions = {}) {
    super();
    this.timeout = options.timeout ?? 30000;
    this.maxRetries = options.maxRetries ?? 5;
    this.logger =
      options.logger ??
      ((level, msg) => {
        const timestamp = new Date().toISOString();
        console[level](`[${timestamp}] [QRHandler] ${msg}`);
      });
  }

  /**
   * Handle QR update dari Baileys connection
   * Dipanggil setiap kali Baileys emit QR baru
   */
  async handleQRUpdate(qr: string): Promise<QRData> {
    // Jika sudah authenticated, abaikan QR baru
    if (this.isAuthenticated) {
      this.logger("warn", "QR received but already authenticated, ignoring");
      throw new Error("Already authenticated");
    }

    // Clear timeout sebelumnya jika ada
    this.clearTimeout();

    // Increment attempt counter
    this.attemptCount++;

    // Cek apakah sudah melebihi max retries
    if (this.attemptCount > this.maxRetries) {
      this.logger(
        "error",
        `Max QR retries (${this.maxRetries}) exceeded, giving up`,
      );
      this.emit("qr:max-retries");
      throw new Error(`Max QR retries (${this.maxRetries}) exceeded`);
    }

    this.logger(
      "info",
      `Processing QR code (attempt ${this.attemptCount}/${this.maxRetries})`,
    );

    const now = Date.now();

    // Generate QR formats
    const [base64, terminal] = await Promise.all([
      this.generateBase64(qr),
      this.generateTerminal(qr),
    ]);

    // Store current QR data
    this.currentQR = {
      raw: qr,
      base64,
      terminal,
      generatedAt: now,
      expiresAt: now + this.timeout,
      attempt: this.attemptCount,
    };

    // Set timeout untuk expire
    this.qrTimeout = setTimeout(() => {
      this.handleQRExpired();
    }, this.timeout);

    // Emit event untuk consumers (Laravel via HTTP/WebSocket)
    this.emit("qr:generated", this.currentQR);

    this.logger(
      "info",
      `QR generated successfully, expires in ${this.timeout / 1000}s`,
    );

    return this.currentQR;
  }

  /**
   * Get current QR sebagai base64 PNG image
   * Returns null jika tidak ada QR aktif atau sudah expired
   */
  async getQRAsBase64(): Promise<string | null> {
    if (!this.currentQR) {
      this.logger("warn", "No QR available");
      return null;
    }

    // Cek apakah QR sudah expired
    if (Date.now() > this.currentQR.expiresAt) {
      this.logger("warn", "QR has expired");
      return null;
    }

    // Return cached atau generate baru
    if (this.currentQR.base64) {
      return this.currentQR.base64;
    }

    // Generate jika belum ada
    const base64 = await this.generateBase64(this.currentQR.raw);
    this.currentQR.base64 = base64;
    return base64;
  }

  /**
   * Get current QR sebagai terminal string
   * Cocok untuk display di console/terminal
   */
  async getQRAsTerminal(): Promise<string | null> {
    if (!this.currentQR) {
      this.logger("warn", "No QR available");
      return null;
    }

    // Cek apakah QR sudah expired
    if (Date.now() > this.currentQR.expiresAt) {
      this.logger("warn", "QR has expired");
      return null;
    }

    // Return cached atau generate baru
    if (this.currentQR.terminal) {
      return this.currentQR.terminal;
    }

    // Generate jika belum ada
    const terminal = await this.generateTerminal(this.currentQR.raw);
    this.currentQR.terminal = terminal;
    return terminal;
  }

  /**
   * Get full QR data object
   */
  getQRData(): QRData | null {
    if (!this.currentQR) {
      return null;
    }

    // Return dengan status validity
    return {
      ...this.currentQR,
      // Update expires info
      expiresAt: this.currentQR.expiresAt,
    };
  }

  /**
   * Cek apakah QR masih valid (belum expired)
   */
  isQRValid(): boolean {
    if (!this.currentQR) {
      return false;
    }
    return Date.now() < this.currentQR.expiresAt;
  }

  /**
   * Get remaining time sebelum QR expired (dalam ms)
   */
  getRemainingTime(): number {
    if (!this.currentQR) {
      return 0;
    }
    const remaining = this.currentQR.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get current attempt count
   */
  getAttemptCount(): number {
    return this.attemptCount;
  }

  /**
   * Clear QR setelah authentication berhasil
   * Dipanggil ketika user berhasil scan dan authenticate
   */
  clearQR(): void {
    this.clearTimeout();
    this.currentQR = null;
    this.isAuthenticated = true;

    this.logger("info", "QR cleared - authentication successful");
    this.emit("qr:cleared");
  }

  /**
   * Reset handler untuk session baru
   * Dipanggil ketika perlu reauth atau logout
   */
  reset(): void {
    this.clearTimeout();
    this.currentQR = null;
    this.attemptCount = 0;
    this.isAuthenticated = false;

    this.logger("info", "QR handler reset");
  }

  /**
   * Set authentication status
   * Dipanggil dari luar ketika connection berhasil
   */
  setAuthenticated(authenticated: boolean): void {
    this.isAuthenticated = authenticated;
    if (authenticated) {
      this.clearQR();
    }
  }

  /**
   * Handle QR expired
   */
  private handleQRExpired(): void {
    this.logger("warn", `QR expired (attempt ${this.attemptCount})`);

    // Keep the QR data for reference tapi mark sebagai expired
    if (this.currentQR) {
      this.currentQR.expiresAt = Date.now() - 1; // Mark as expired
    }

    this.emit("qr:expired", this.attemptCount);

    // Note: Baileys akan otomatis generate QR baru,
    // jadi kita tidak perlu trigger apapun di sini
  }

  /**
   * Clear timeout internal
   */
  private clearTimeout(): void {
    if (this.qrTimeout) {
      clearTimeout(this.qrTimeout);
      this.qrTimeout = null;
    }
  }

  /**
   * Generate QR sebagai base64 PNG
   */
  private async generateBase64(qr: string): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(qr, {
        type: "image/png",
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });
      return dataUrl;
    } catch (error) {
      this.logger("error", `Failed to generate base64 QR: ${error}`);
      throw error;
    }
  }

  /**
   * Generate QR untuk terminal display
   */
  private async generateTerminal(qr: string): Promise<string> {
    try {
      const terminalQR = await QRCode.toString(qr, {
        type: "terminal",
        small: true,
      });
      return terminalQR;
    } catch (error) {
      this.logger("error", `Failed to generate terminal QR: ${error}`);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearTimeout();
    this.removeAllListeners();
    this.currentQR = null;
    this.logger("info", "QR handler destroyed");
  }
}

// Type augmentation untuk proper event typing
export interface QRHandlerEventMethods {
  on<K extends keyof QREvents>(event: K, listener: QREvents[K]): this;
  emit<K extends keyof QREvents>(
    event: K,
    ...args: Parameters<QREvents[K]>
  ): boolean;
  off<K extends keyof QREvents>(event: K, listener: QREvents[K]): this;
  once<K extends keyof QREvents>(event: K, listener: QREvents[K]): this;
}

export default QRHandler;
