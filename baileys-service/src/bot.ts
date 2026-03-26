/**
 * WhatsApp SLA Bot - With Auto Reply
 *
 * Bot yang bisa menerima dan membalas pesan secara otomatis
 */

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";

const SESSION_PATH = path.join(__dirname, "..", "sessions", "main");
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const logger = pino({ level: "warn" });

let retryCount = 0;
let currentSocket: WASocket | null = null;

// ==================== BOT RESPONSES ====================
const MENU_TEXT = `🐔 *SELAMAT DATANG DI TOKO AYAM SLA!*

📋 *MENU TERSEDIA:*
1. Telur Ayam - Rp 25.000/kg
2. Ayam Potong - Rp 35.000/ekor
3. Pakan Ayam - Rp 150.000/karung

📝 *CARA PESAN:*
Ketik: pesan [produk] [jumlah]
Contoh: pesan telur 5 kg

📞 *BANTUAN:*
Ketik "help" untuk panduan
Ketik "status" untuk cek pesanan`;

const HELP_TEXT = `❓ *PANDUAN PENGGUNAAN BOT*

*Perintah yang tersedia:*
• menu - Lihat daftar produk
• pesan [produk] [jumlah] - Buat pesanan
• status - Cek status pesanan
• help - Tampilkan panduan ini

*Contoh pemesanan:*
• pesan telur 2 kg
• pesan ayam 3 ekor
• pesan pakan 1 karung

*Jam operasional:*
Senin - Sabtu: 08:00 - 17:00

Butuh bantuan? Ketik "admin" untuk bicara dengan CS.`;

// ==================== MESSAGE HANDLER ====================
async function handleMessage(socket: WASocket, message: proto.IWebMessageInfo) {
  try {
    const remoteJid = message.key.remoteJid;
    if (!remoteJid) return;

    // Skip jika dari grup atau status
    if (remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") {
      return;
    }

    // Skip jika pesan dari bot sendiri
    if (message.key.fromMe) return;

    // Extract text dari berbagai format message
    const messageContent = message.message;
    if (!messageContent) return;

    let text = "";
    if (messageContent.conversation) {
      text = messageContent.conversation;
    } else if (messageContent.extendedTextMessage?.text) {
      text = messageContent.extendedTextMessage.text;
    } else if (messageContent.imageMessage?.caption) {
      text = messageContent.imageMessage.caption;
    }

    if (!text) return;

    const lowerText = text.toLowerCase().trim();
    const senderName = message.pushName || "Customer";

    console.log(`\n💬 Pesan dari ${senderName} (${remoteJid}):`);
    console.log(`   "${text}"`);

    // Determine response based on message
    let response = "";

    if (
      lowerText === "menu" ||
      lowerText === "katalog" ||
      lowerText === "daftar"
    ) {
      response = MENU_TEXT;
    } else if (
      lowerText === "help" ||
      lowerText === "bantuan" ||
      lowerText === "?"
    ) {
      response = HELP_TEXT;
    } else if (lowerText === "status" || lowerText === "cek pesanan") {
      response = `📦 *STATUS PESANAN*\n\nMaaf ${senderName}, belum ada pesanan aktif.\n\nKetik "menu" untuk melihat produk kami.`;
    } else if (
      lowerText === "admin" ||
      lowerText === "cs" ||
      lowerText === "operator"
    ) {
      response = `👋 Halo ${senderName}!\n\nPermintaan Anda untuk berbicara dengan admin sudah diterima.\n\nAdmin akan segera menghubungi Anda.\n\n⏰ Estimasi waktu tunggu: 5-10 menit`;
    } else if (
      lowerText.startsWith("pesan ") ||
      lowerText.startsWith("order ") ||
      lowerText.startsWith("beli ")
    ) {
      const orderText = text.substring(text.indexOf(" ") + 1);
      response = `✅ *PESANAN DITERIMA*\n\n📝 Detail: ${orderText}\n👤 Nama: ${senderName}\n\n⏳ Pesanan sedang diproses.\nAdmin akan menghubungi untuk konfirmasi.\n\nTerima kasih sudah berbelanja! 🙏`;
    } else if (
      lowerText === "halo" ||
      lowerText === "hai" ||
      lowerText === "hi" ||
      lowerText === "hello"
    ) {
      response = `👋 Halo ${senderName}!\n\nSelamat datang di Toko Ayam SLA! 🐔\n\nKetik "menu" untuk melihat produk kami.`;
    } else {
      // Default response
      response = `Halo ${senderName}! 👋\n\nMaaf, saya tidak mengerti pesan Anda.\n\nKetik:\n• "menu" - lihat produk\n• "help" - panduan\n• "admin" - hubungi CS`;
    }

    // Send reply
    if (response) {
      console.log(`📤 Membalas...`);
      await socket.sendMessage(remoteJid, { text: response });
      console.log(`✅ Balasan terkirim!`);
    }
  } catch (err) {
    console.error("❌ Error handling message:", err);
  }
}

// ==================== CONNECTION LOGIC ====================
function clearSession(): void {
  if (fs.existsSync(SESSION_PATH)) {
    console.log("🗑️  Clearing session...");
    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
  }
  fs.mkdirSync(SESSION_PATH, { recursive: true });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startBot(clearFirst: boolean = false): Promise<void> {
  if (clearFirst) {
    clearSession();
  } else if (!fs.existsSync(SESSION_PATH)) {
    fs.mkdirSync(SESSION_PATH, { recursive: true });
  }

  console.log(
    `\n🤖 Starting WhatsApp SLA Bot (attempt ${retryCount + 1}/${MAX_RETRIES})...\n`,
  );

  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📡 Baileys version: ${version.join(".")}`);

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    console.log(`🔑 Session registered: ${state.creds.registered}`);
    console.log(`👤 Me: ${state.creds.me?.id || "not authenticated"}`);

    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      browser: ["WhatsApp SLA Bot", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
    });

    currentSocket = socket;
    socket.ev.on("creds.update", saveCreds);

    // ===== MESSAGE HANDLER =====
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        await handleMessage(socket, msg);
      }
    });

    // ===== CONNECTION HANDLER =====
    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("\n⚠️  QR Code diperlukan untuk autentikasi!");
        console.log("   Jalankan quick-qr.ts atau quick-pair.ts untuk auth.\n");
      }

      if (connection === "open") {
        retryCount = 0;
        console.log("\n✅ BOT ONLINE dan siap menerima pesan!");
        console.log(`   JID: ${socket.user?.id}`);
        console.log("\n📱 Bot akan otomatis membalas pesan masuk.\n");
        console.log("─".repeat(50));
      }

      if (connection === "close") {
        const error = lastDisconnect?.error as Boom;
        const statusCode = error?.output?.statusCode;

        console.log(`\n📴 Connection closed (code: ${statusCode})`);

        switch (statusCode) {
          case DisconnectReason.loggedOut:
            console.log("⚠️  Logged out - need re-authentication");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS);
              await startBot(true);
            }
            break;

          case DisconnectReason.restartRequired:
            console.log("🔄 Restart required");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS * 2);
              await startBot(false);
            }
            break;

          case DisconnectReason.connectionLost:
          case DisconnectReason.connectionClosed:
          case DisconnectReason.timedOut:
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS);
              await startBot(false);
            }
            break;

          case DisconnectReason.connectionReplaced:
            console.log("⚠️  Connection replaced by another device");
            process.exit(0);
            break;

          default:
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS * 2);
              await startBot(false);
            }
        }
      }
    });
  } catch (err) {
    console.error("\n❌ Error:", err);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      await sleep(RETRY_DELAY_MS);
      await startBot(true);
    } else {
      process.exit(1);
    }
  }
}

// ==================== MAIN ====================
async function main() {
  console.log("\n" + "═".repeat(50));
  console.log("🤖 WhatsApp SLA Bot - Auto Reply");
  console.log("═".repeat(50));
  console.log(`\n📁 Session: ${SESSION_PATH}`);

  process.on("SIGINT", async () => {
    console.log("\n\n👋 Shutting down bot...");
    if (currentSocket) {
      currentSocket.end(undefined);
    }
    process.exit(0);
  });

  // Check if session exists
  const sessionExists = fs.existsSync(path.join(SESSION_PATH, "creds.json"));
  if (!sessionExists) {
    console.log("\n⚠️  Session tidak ditemukan!");
    console.log(
      "   Jalankan quick-qr.ts atau quick-pair.ts dulu untuk auth.\n",
    );
    process.exit(1);
  }

  await startBot(false);
}

main().catch(console.error);
