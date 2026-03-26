/**
 * Quick QR Script - Robust Version
 *
 * Handles error 515 (restartRequired) dengan auto-reconnect
 * dan proper session cleanup
 */

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import qrTerminal from "qrcode-terminal";

const SESSION_PATH = path.join(__dirname, "..", "sessions", "main");
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000; // 5 detik delay sebelum retry

const logger = pino({ level: "warn" });

let retryCount = 0;
let currentSocket: WASocket | null = null;

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

async function startConnection(clearFirst: boolean = false): Promise<void> {
  if (clearFirst) {
    clearSession();
  } else {
    // Ensure directory exists
    if (!fs.existsSync(SESSION_PATH)) {
      fs.mkdirSync(SESSION_PATH, { recursive: true });
    }
  }

  console.log(
    `\n🔌 Starting connection (attempt ${retryCount + 1}/${MAX_RETRIES})...\n`,
  );

  try {
    // Fetch Baileys version
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📡 Baileys version: ${version.join(".")}`);

    // Initialize auth state
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    console.log(`🔑 Session registered: ${state.creds.registered}\n`);

    // Create socket
    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      browser: ["WhatsApp SLA", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      // Penting: retry config
      retryRequestDelayMs: 2000,
      defaultQueryTimeoutMs: 60000,
    });

    currentSocket = socket;

    // Save credentials on update
    socket.ev.on("creds.update", saveCreds);

    // Handle connection updates
    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code
      if (qr) {
        console.log("\n📱 Scan QR code ini dengan WhatsApp:\n");
        qrTerminal.generate(qr, { small: true });
        console.log("\n⏳ Menunggu scan...\n");
      }

      // Connected!
      if (connection === "open") {
        retryCount = 0; // Reset retry counter
        console.log("\n✅ BERHASIL! WhatsApp terkoneksi!");
        console.log(`   JID: ${socket.user?.id}`);
        console.log("\n👋 Tekan Ctrl+C untuk keluar\n");
      }

      // Connection closed
      if (connection === "close") {
        const error = lastDisconnect?.error as Boom;
        const statusCode = error?.output?.statusCode;
        const errorData = error?.output?.payload;

        console.log(`\n📴 Koneksi tertutup`);
        console.log(`   Code: ${statusCode}`);
        console.log(`   Error: ${JSON.stringify(errorData || {})}`);

        // Determine action based on status code
        switch (statusCode) {
          case DisconnectReason.loggedOut:
            // 401 - Logged out, need fresh auth
            console.log("\n⚠️  Logged out - perlu autentikasi ulang");
            clearSession();
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`\n⏳ Retry dalam ${RETRY_DELAY_MS / 1000} detik...`);
              await sleep(RETRY_DELAY_MS);
              await startConnection(true);
            }
            break;

          case DisconnectReason.restartRequired:
            // 515 - Restart required
            console.log("\n🔄 Server meminta restart");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(
                `\n⏳ Reconnect dalam ${RETRY_DELAY_MS / 1000} detik...`,
              );
              await sleep(RETRY_DELAY_MS);
              await startConnection(false); // Jangan clear session
            } else {
              console.log(
                "\n❌ Max retries tercapai. Coba clear session manual:",
              );
              console.log(`   rm -rf ${SESSION_PATH}`);
            }
            break;

          case DisconnectReason.connectionLost:
          case DisconnectReason.connectionClosed:
          case DisconnectReason.timedOut:
            // Reconnectable errors
            console.log("\n🔄 Koneksi terputus, mencoba reconnect...");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS);
              await startConnection(false);
            }
            break;

          case DisconnectReason.badSession:
          case DisconnectReason.multideviceMismatch:
            // Need fresh session
            console.log("\n⚠️  Session bermasalah, perlu fresh start");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS);
              await startConnection(true); // Clear session
            }
            break;

          case DisconnectReason.connectionReplaced:
            // 440 - Another device connected
            console.log("\n⚠️  Koneksi digantikan device lain");
            console.log("   Jalankan ulang script jika ingin konek lagi");
            process.exit(0);
            break;

          default:
            console.log(`\n❓ Unknown error code: ${statusCode}`);
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              // Untuk unknown error, coba clear session
              await sleep(RETRY_DELAY_MS * 2);
              await startConnection(true);
            } else {
              process.exit(1);
            }
        }
      }
    });

    // Handle messages (optional - untuk konfirmasi koneksi aktif)
    socket.ev.on("messages.upsert", ({ messages }) => {
      if (messages.length > 0) {
        console.log(`📨 Received ${messages.length} message(s)`);
      }
    });
  } catch (err) {
    console.error("\n❌ Error:", err);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`\n⏳ Retry dalam ${RETRY_DELAY_MS / 1000} detik...`);
      await sleep(RETRY_DELAY_MS);
      await startConnection(true);
    } else {
      process.exit(1);
    }
  }
}

async function main() {
  console.log("\n" + "═".repeat(50));
  console.log("🌀 WhatsApp SLA - QR Authentication (Robust)");
  console.log("═".repeat(50));
  console.log(`\n📁 Session: ${SESSION_PATH}`);

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n👋 Shutting down...");
    if (currentSocket) {
      currentSocket.end(undefined);
    }
    process.exit(0);
  });

  // Start with fresh session untuk pertama kali
  const sessionExists = fs.existsSync(path.join(SESSION_PATH, "creds.json"));
  await startConnection(!sessionExists); // Clear jika belum ada session
}

main().catch(console.error);
