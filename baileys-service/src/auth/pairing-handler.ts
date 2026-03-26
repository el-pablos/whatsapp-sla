import { EventEmitter } from "events";
import type { WASocket } from "@whiskeysockets/baileys";

/**
 * Phone number validation result
 */
export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Pairing code result
 */
export interface PairingCodeResult {
  success: boolean;
  code?: string;
  phoneNumber?: string;
  expiresAt?: number;
  error?: string;
}

/**
 * Pairing handler events
 */
export interface PairingHandlerEvents {
  "pairing:code": { code: string; phoneNumber: string; expiresAt: number };
  "pairing:expired": { phoneNumber: string };
  "pairing:success": { jid: string };
  "pairing:error": { error: string; phoneNumber?: string };
}

/**
 * PairingHandler - Handler untuk WhatsApp pairing code authentication
 *
 * Pairing code adalah alternatif dari QR code untuk menghubungkan
 * WhatsApp Web. User memasukkan code 8 digit di aplikasi WhatsApp
 * di ponsel mereka.
 *
 * Catatan penting:
 * - Hanya bisa connect ke satu device per pairing code
 * - Nomor telepon harus dalam format internasional tanpa prefix
 * - Code berlaku selama ~60-120 detik
 */
export class PairingHandler extends EventEmitter {
  private sock: WASocket | null = null;
  private pairingCode: string | null = null;
  private pairingPhoneNumber: string | null = null;
  private pairingTimeout: NodeJS.Timeout | null = null;
  private pairingExpiresAt: number | null = null;

  // Pairing code timeout dalam milliseconds (default: 120 detik)
  private readonly PAIRING_TIMEOUT_MS = 120 * 1000;

  constructor() {
    super();
  }

  /**
   * Set socket instance yang akan digunakan untuk request pairing code
   * @param sock - WASocket instance dari Baileys
   */
  setSocket(sock: WASocket): void {
    this.sock = sock;
  }

  /**
   * Validasi format nomor telepon
   *
   * Nomor telepon harus:
   * - Tidak mengandung +, (), -, atau spasi
   * - Hanya angka
   * - Harus ada country code
   * - Minimal 10 digit (country code + nomor)
   *
   * @param phoneNumber - Nomor telepon yang akan divalidasi
   * @returns Hasil validasi dengan nomor yang sudah dinormalisasi
   */
  validatePhoneNumber(phoneNumber: string): PhoneValidationResult {
    // Remove semua karakter non-digit
    const normalized = phoneNumber.replace(/[^\d]/g, "");

    // Validasi minimal panjang (country code + nomor lokal)
    if (normalized.length < 10) {
      return {
        valid: false,
        normalized: "",
        error:
          "Nomor telepon terlalu pendek. Harus minimal 10 digit termasuk kode negara.",
      };
    }

    // Validasi maksimal panjang (15 digit menurut ITU-T E.164)
    if (normalized.length > 15) {
      return {
        valid: false,
        normalized: "",
        error: "Nomor telepon terlalu panjang. Maksimal 15 digit.",
      };
    }

    // Validasi tidak boleh dimulai dengan 0 (harus ada country code)
    if (normalized.startsWith("0")) {
      return {
        valid: false,
        normalized: "",
        error:
          "Nomor telepon tidak boleh dimulai dengan 0. Gunakan kode negara (contoh: 62 untuk Indonesia).",
      };
    }

    return {
      valid: true,
      normalized,
    };
  }

  /**
   * Request pairing code untuk nomor telepon tertentu
   *
   * Sebelum memanggil method ini, pastikan:
   * 1. Socket sudah di-set dengan setSocket()
   * 2. printQRInTerminal: false di socket config
   * 3. Socket belum terdaftar (authState.creds.registered === false)
   *
   * @param phoneNumber - Nomor telepon dengan country code (contoh: "6281234567890")
   * @returns Hasil request pairing code
   */
  async requestPairingCode(phoneNumber: string): Promise<PairingCodeResult> {
    // 1. Validasi socket sudah di-set
    if (!this.sock) {
      const error = "Socket belum di-set. Panggil setSocket() terlebih dahulu.";
      this.emit("pairing:error", { error });
      return { success: false, error };
    }

    // 2. Validasi format nomor telepon
    const validation = this.validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      const error = validation.error || "Format nomor telepon tidak valid";
      this.emit("pairing:error", { error, phoneNumber });
      return { success: false, error };
    }

    const normalizedPhone = validation.normalized;

    // 3. Cek apakah credentials sudah terdaftar
    // Jika sudah terdaftar, tidak perlu pairing code lagi
    if (this.sock.authState?.creds?.registered) {
      const error = "Session sudah terdaftar. Tidak perlu pairing code.";
      this.emit("pairing:error", { error, phoneNumber: normalizedPhone });
      return { success: false, error };
    }

    // 4. Clear pairing code sebelumnya jika ada
    this.clearPairingCode();

    try {
      // 5. Request pairing code dari Baileys
      // Method ini akan return string 8 karakter
      const code = await this.sock.requestPairingCode(normalizedPhone);

      // 6. Store pairing code dan phone number
      this.pairingCode = code;
      this.pairingPhoneNumber = normalizedPhone;
      this.pairingExpiresAt = Date.now() + this.PAIRING_TIMEOUT_MS;

      // 7. Set timeout untuk clear pairing code
      this.pairingTimeout = setTimeout(() => {
        this.handlePairingExpired();
      }, this.PAIRING_TIMEOUT_MS);

      // 8. Emit event pairing:code
      const eventData = {
        code,
        phoneNumber: normalizedPhone,
        expiresAt: this.pairingExpiresAt,
      };
      this.emit("pairing:code", eventData);

      // 9. Return result
      return {
        success: true,
        code,
        phoneNumber: normalizedPhone,
        expiresAt: this.pairingExpiresAt,
      };
    } catch (err) {
      // Handle error dari Baileys
      const errorMessage = this.parseError(err);
      this.emit("pairing:error", {
        error: errorMessage,
        phoneNumber: normalizedPhone,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current pairing code jika masih valid
   * @returns Pairing code atau null jika tidak ada/expired
   */
  getCurrentCode(): string | null {
    // Cek apakah masih dalam waktu valid
    if (this.pairingExpiresAt && Date.now() > this.pairingExpiresAt) {
      this.clearPairingCode();
      return null;
    }
    return this.pairingCode;
  }

  /**
   * Get pairing status
   * @returns Object dengan status pairing
   */
  getStatus(): {
    hasPairingCode: boolean;
    code: string | null;
    phoneNumber: string | null;
    expiresAt: number | null;
    remainingMs: number;
  } {
    const now = Date.now();
    const remainingMs =
      this.pairingExpiresAt && this.pairingExpiresAt > now
        ? this.pairingExpiresAt - now
        : 0;

    return {
      hasPairingCode: !!this.pairingCode && remainingMs > 0,
      code: remainingMs > 0 ? this.pairingCode : null,
      phoneNumber: this.pairingPhoneNumber,
      expiresAt: this.pairingExpiresAt,
      remainingMs,
    };
  }

  /**
   * Clear pairing code dan reset state
   */
  clearPairingCode(): void {
    // Clear timeout jika ada
    if (this.pairingTimeout) {
      clearTimeout(this.pairingTimeout);
      this.pairingTimeout = null;
    }

    // Reset state
    this.pairingCode = null;
    this.pairingPhoneNumber = null;
    this.pairingExpiresAt = null;
  }

  /**
   * Handle ketika pairing code expired
   * Di-trigger oleh timeout atau manual check
   */
  private handlePairingExpired(): void {
    const phoneNumber = this.pairingPhoneNumber;

    // Emit event expired
    if (phoneNumber) {
      this.emit("pairing:expired", { phoneNumber });
    }

    // Clear state
    this.clearPairingCode();
  }

  /**
   * Notify bahwa pairing berhasil
   * Dipanggil dari luar ketika connection.update dengan connected=true
   *
   * @param jid - WhatsApp JID yang terhubung
   */
  notifyPairingSuccess(jid: string): void {
    this.emit("pairing:success", { jid });
    this.clearPairingCode();
  }

  /**
   * Parse error dari Baileys menjadi pesan yang lebih user-friendly
   * @param err - Error dari Baileys
   * @returns Error message yang readable
   */
  private parseError(err: unknown): string {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();

      // Handle common errors
      if (msg.includes("not registered")) {
        return "requestPairingCode tidak tersedia. Pastikan versi Baileys mendukung fitur ini.";
      }

      if (msg.includes("already registered")) {
        return "Session sudah terdaftar. Tidak perlu pairing code.";
      }

      if (msg.includes("invalid phone")) {
        return "Nomor telepon tidak valid atau tidak terdaftar di WhatsApp.";
      }

      if (msg.includes("rate limit") || msg.includes("too many")) {
        return "Terlalu banyak request. Coba lagi dalam beberapa menit.";
      }

      if (msg.includes("timeout")) {
        return "Request timeout. Cek koneksi internet.";
      }

      return err.message;
    }

    if (typeof err === "string") {
      return err;
    }

    return "Terjadi error yang tidak diketahui saat request pairing code.";
  }

  /**
   * Check apakah Baileys version mendukung pairing code
   * @returns true jika didukung
   */
  isPairingCodeSupported(): boolean {
    if (!this.sock) {
      return false;
    }

    // Check apakah method requestPairingCode ada
    return typeof this.sock.requestPairingCode === "function";
  }

  /**
   * Cleanup handler - panggil saat disconnect atau cleanup
   */
  destroy(): void {
    this.clearPairingCode();
    this.sock = null;
    this.removeAllListeners();
  }
}
