/**
 * Send Test Message Script
 * Kirim pesan test ke nomor tertentu
 */

import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import path from "path";

const TO_NUMBER = process.argv[2] || "6285817378442";
const MESSAGE =
  process.argv[3] ||
  "🤖 Test message dari WhatsApp SLA Bot!\n\nJika kamu menerima pesan ini, bot sudah aktif dan siap digunakan.";
const SESSION_PATH = path.join(__dirname, "..", "sessions", "main");

const logger = pino({ level: "warn" });

async function main() {
  console.log("\n📤 WhatsApp SLA - Send Test Message\n");
  console.log(`📱 To: ${TO_NUMBER}`);
  console.log(`💬 Message: ${MESSAGE.substring(0, 50)}...`);

  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);

    // Skip check registered - sometimes it's false but connection still works
    console.log(`🔑 Session registered: ${state.creds.registered}`);
    console.log(`   Me: ${state.creds.me?.id || "unknown"}`);

    if (!state.creds.me?.id) {
      console.log("\n❌ Session belum terautentikasi!");
      console.log("   Jalankan quick-qr.ts atau quick-pair.ts dulu.\n");
      process.exit(1);
    }

    console.log("\n🔌 Connecting...");

    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
    });

    socket.ev.on("creds.update", saveCreds);

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timeout")),
        30000,
      );

      socket.ev.on("connection.update", async (update) => {
        if (update.connection === "open") {
          clearTimeout(timeout);
          console.log("✅ Connected!\n");

          try {
            // Format JID
            const jid = `${TO_NUMBER}@s.whatsapp.net`;

            console.log(`📤 Sending to ${jid}...`);

            // Send message
            const result = await socket.sendMessage(jid, { text: MESSAGE });

            console.log("\n✅ MESSAGE SENT SUCCESSFULLY!");
            console.log(`   ID: ${result?.key?.id}`);
            console.log(`   To: ${TO_NUMBER}`);
            console.log(`   Status: Delivered to server\n`);

            // Disconnect after sending
            setTimeout(() => {
              socket.end(undefined);
              resolve();
            }, 2000);
          } catch (err) {
            console.error("❌ Failed to send:", err);
            socket.end(undefined);
            reject(err);
          }
        }

        if (update.connection === "close") {
          clearTimeout(timeout);
          reject(new Error("Connection closed"));
        }
      });
    });
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
