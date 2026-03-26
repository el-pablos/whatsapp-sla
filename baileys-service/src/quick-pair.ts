/**
 * Quick Pairing Script - Robust Version
 *
 * Handles error 515 dan error lainnya dengan auto-reconnect
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

const PHONE_NUMBER = process.argv[2] || "6281385427537";
const SESSION_PATH = path.join(__dirname, "..", "sessions", "main");
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const logger = pino({ level: "warn" });

let retryCount = 0;
let currentSocket: WASocket | null = null;
let pairingRequested = false;

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
    pairingRequested = false; // Reset flag
  } else {
    if (!fs.existsSync(SESSION_PATH)) {
      fs.mkdirSync(SESSION_PATH, { recursive: true });
    }
  }

  console.log(
    `\n🔌 Starting connection (attempt ${retryCount + 1}/${MAX_RETRIES})...\n`,
  );

  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📡 Baileys version: ${version.join(".")}`);

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    console.log(`🔑 Session registered: ${state.creds.registered}`);

    // Jika sudah registered, tidak perlu pairing
    if (state.creds.registered) {
      console.log("\n✅ Session sudah terautentikasi!");
      console.log("   Gunakan session yang ada atau hapus untuk fresh start:");
      console.log(`   rm -rf ${SESSION_PATH}\n`);
      return;
    }

    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false, // WAJIB false untuk pairing
      browser: ["WhatsApp SLA", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
    });

    currentSocket = socket;
    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Saat QR muncul = waktu yang tepat untuk request pairing
      if (qr && !pairingRequested && !state.creds.registered) {
        pairingRequested = true;
        console.log("\n⚡ Requesting pairing code...\n");

        try {
          const code = await socket.requestPairingCode(PHONE_NUMBER);

          console.log("═".repeat(50));
          console.log(`🔐 PAIRING CODE: ${code}`);
          console.log("═".repeat(50));
          console.log("\n📱 Di HP WhatsApp kamu:");
          console.log("   1. Buka Settings → Linked Devices");
          console.log("   2. Tap 'Link a Device'");
          console.log("   3. Pilih 'Link with phone number instead'");
          console.log(`   4. Masukkan: ${PHONE_NUMBER}`);
          console.log(`   5. Input code: ${code}`);
          console.log("\n⏳ Menunggu verifikasi...\n");
        } catch (err) {
          console.error("❌ Gagal request pairing code:", err);
          pairingRequested = false; // Allow retry
        }
      }

      if (connection === "open") {
        retryCount = 0;
        console.log("\n✅ BERHASIL! WhatsApp terkoneksi!");
        console.log(`   JID: ${socket.user?.id}`);
        console.log("\n👋 Tekan Ctrl+C untuk keluar\n");
      }

      if (connection === "close") {
        const error = lastDisconnect?.error as Boom;
        const statusCode = error?.output?.statusCode;

        console.log(`\n📴 Koneksi tertutup (code: ${statusCode})`);

        switch (statusCode) {
          case DisconnectReason.loggedOut:
            console.log("⚠️  Logged out - fresh start needed");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS);
              await startConnection(true);
            }
            break;

          case DisconnectReason.restartRequired:
            console.log("🔄 Server minta restart");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              // PENTING: Untuk error 515, tunggu lebih lama
              console.log(`⏳ Tunggu ${(RETRY_DELAY_MS * 2) / 1000} detik...`);
              await sleep(RETRY_DELAY_MS * 2);
              await startConnection(false);
            } else {
              console.log(
                "\n❌ Max retries. Tunggu beberapa menit lalu coba lagi.",
              );
            }
            break;

          case DisconnectReason.connectionLost:
          case DisconnectReason.connectionClosed:
          case DisconnectReason.timedOut:
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS);
              await startConnection(false);
            }
            break;

          case DisconnectReason.badSession:
          case DisconnectReason.multideviceMismatch:
            console.log("⚠️  Session corrupt, clearing...");
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS);
              await startConnection(true);
            }
            break;

          case DisconnectReason.connectionReplaced:
            console.log("⚠️  Koneksi digantikan device lain");
            process.exit(0);
            break;

          default:
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              await sleep(RETRY_DELAY_MS * 2);
              await startConnection(true);
            } else {
              process.exit(1);
            }
        }
      }
    });
  } catch (err) {
    console.error("\n❌ Error:", err);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      await sleep(RETRY_DELAY_MS);
      await startConnection(true);
    } else {
      process.exit(1);
    }
  }
}

async function main() {
  console.log("\n" + "═".repeat(50));
  console.log("🌀 WhatsApp SLA - Pairing Code Authentication");
  console.log("═".repeat(50));
  console.log(`\n📱 Phone: ${PHONE_NUMBER}`);
  console.log(`📁 Session: ${SESSION_PATH}`);

  process.on("SIGINT", async () => {
    console.log("\n\n👋 Shutting down...");
    if (currentSocket) {
      currentSocket.end(undefined);
    }
    process.exit(0);
  });

  // Start fresh untuk pairing
  await startConnection(true);
}

main().catch(console.error);
