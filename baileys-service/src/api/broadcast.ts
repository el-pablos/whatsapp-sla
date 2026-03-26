/**
 * Broadcast API Routes
 *
 * Endpoint untuk mengirim pesan broadcast ke multiple nomor WhatsApp.
 * Digunakan oleh Laravel scheduler untuk broadcast katalog harian.
 */

import { Router, Request, Response } from "express";
import type { WASocket } from "@whiskeysockets/baileys";
import type { ConnectionManager } from "../core/connection-manager";

export interface BroadcastRequest {
  phones: string[];
  message: string;
  delay_ms?: number;
}

export interface BroadcastResult {
  phone: string;
  success: boolean;
  message_id?: string;
  error?: string;
}

export interface BroadcastResponse {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  results: BroadcastResult[];
  duration_ms: number;
}

/**
 * Format nomor telepon ke format WhatsApp JID
 */
function formatPhoneToJid(phone: string): string {
  // Hapus semua karakter non-digit
  let clean = phone.replace(/[^\d]/g, "");

  // Handle format Indonesia
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  }

  // Pastikan tidak ada @s.whatsapp.net ganda
  if (clean.includes("@")) {
    return clean;
  }

  return clean + "@s.whatsapp.net";
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create broadcast routes
 */
export function createBroadcastRoutes(
  connectionManager: ConnectionManager,
): Router {
  const router = Router();

  /**
   * POST /broadcast
   *
   * Kirim pesan ke multiple nomor telepon secara sequential.
   *
   * Body:
   * - phones: string[] - Array nomor telepon
   * - message: string - Pesan yang akan dikirim
   * - delay_ms?: number - Delay antar pesan (default: 2000ms)
   */
  router.post("/", async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { phones, message, delay_ms = 2000 }: BroadcastRequest = req.body;

    // Validasi input
    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Parameter 'phones' harus berupa array yang tidak kosong",
      });
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Parameter 'message' harus berupa string yang tidak kosong",
      });
    }

    // Cek koneksi WhatsApp
    if (!connectionManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: "WhatsApp tidak terkoneksi",
        connection_status: connectionManager.status,
      });
    }

    // Get socket dari connection manager
    const socket = connectionManager.getSocket();
    if (!socket) {
      return res.status(503).json({
        success: false,
        error: "Socket WhatsApp tidak tersedia",
      });
    }

    console.log(`\n📢 Starting broadcast to ${phones.length} numbers...`);
    console.log(`   Message length: ${message.length} chars`);
    console.log(`   Delay: ${delay_ms}ms`);

    const results: BroadcastResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    // Kirim ke setiap nomor secara sequential
    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];
      const jid = formatPhoneToJid(phone);

      try {
        console.log(`   [${i + 1}/${phones.length}] Sending to ${phone}...`);

        const result = await socket.sendMessage(jid, { text: message });
        const messageId = result?.key?.id;

        results.push({
          phone,
          success: true,
          message_id: messageId || undefined,
        });

        sentCount++;
        console.log(`   ✅ Sent to ${phone} (ID: ${messageId || "unknown"})`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        results.push({
          phone,
          success: false,
          error: errorMessage,
        });

        failedCount++;
        console.log(`   ❌ Failed to ${phone}: ${errorMessage}`);
      }

      // Delay antar pesan (kecuali yang terakhir)
      if (i < phones.length - 1) {
        await sleep(delay_ms);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n📊 Broadcast complete:`);
    console.log(`   Total: ${phones.length}`);
    console.log(`   Sent: ${sentCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Duration: ${duration}ms`);

    const response: BroadcastResponse = {
      success: failedCount === 0,
      total: phones.length,
      sent: sentCount,
      failed: failedCount,
      results,
      duration_ms: duration,
    };

    return res.json(response);
  });

  /**
   * POST /broadcast/single
   *
   * Kirim pesan ke satu nomor telepon.
   * Endpoint yang lebih sederhana untuk testing.
   *
   * Body:
   * - phone: string - Nomor telepon
   * - message: string - Pesan yang akan dikirim
   */
  router.post("/single", async (req: Request, res: Response) => {
    const { phone, message } = req.body;

    // Validasi input
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        error: "Parameter 'phone' harus berupa string",
      });
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Parameter 'message' harus berupa string yang tidak kosong",
      });
    }

    // Cek koneksi WhatsApp
    if (!connectionManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: "WhatsApp tidak terkoneksi",
      });
    }

    const socket = connectionManager.getSocket();
    if (!socket) {
      return res.status(503).json({
        success: false,
        error: "Socket WhatsApp tidak tersedia",
      });
    }

    const jid = formatPhoneToJid(phone);

    try {
      console.log(`📤 Sending single message to ${phone}...`);

      const result = await socket.sendMessage(jid, { text: message });
      const messageId = result?.key?.id;
      const timestamp = result?.messageTimestamp;

      console.log(
        `✅ Message sent to ${phone} (ID: ${messageId || "unknown"})`,
      );

      return res.json({
        success: true,
        phone,
        message_id: messageId || undefined,
        timestamp: timestamp || undefined,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.log(`❌ Failed to send to ${phone}: ${errorMessage}`);

      return res.status(500).json({
        success: false,
        phone,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /broadcast/status
   *
   * Cek status koneksi WhatsApp untuk broadcast.
   */
  router.get("/status", async (_req: Request, res: Response) => {
    const isConnected = connectionManager.isConnected();
    const status = connectionManager.status;

    return res.json({
      ready: isConnected,
      connection_status: status,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

export default createBroadcastRoutes;
