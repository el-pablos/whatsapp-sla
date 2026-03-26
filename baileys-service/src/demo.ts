/**
 * Demo script untuk testing Socket Initializer
 *
 * Jalankan dengan: npm run dev
 * atau: npx ts-node src/demo.ts
 */

import { initializeSocket, requestPairingCode } from "./socket";
import { BaileysEventEmitter } from "./handlers/events";
import type { SocketConfig } from "./types";
import readline from "readline";
import path from "path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("🌀 WhatsApp SLA - Baileys Socket Demo\n");

  try {
    // Setup event emitter (tanpa Redis untuk demo)
    const eventEmitter = new BaileysEventEmitter();

    // Setup event listeners
    eventEmitter.on("qr:generated", async (data) => {
      console.log("\n🔲 QR Code generated!");
      console.log("Scan QR code dengan WhatsApp untuk login.\n");
    });

    eventEmitter.on("auth:success", (data) => {
      console.log(`✅ Auth successful! JID: ${data.jid}\n`);
    });

    eventEmitter.on("connection:status", (data) => {
      console.log(`📡 Connection status: ${data.status}`);
    });

    eventEmitter.on("message:received", (data) => {
      console.log("📩 Message received:", data.key);
    });

    // Ask user for authentication method
    const authMethod = await question(
      "Choose auth method:\n1. QR Code\n2. Pairing Code\n\nEnter (1/2): ",
    );

    const sessionPath = path.join(__dirname, "..", "demo-sessions");
    const config: SocketConfig = {
      sessionPath,
      browser: ["WhatsApp SLA Demo", "Chrome", "1.0.0"],
      printQRInTerminal: authMethod === "1",
    };

    console.log("\n🔌 Initializing socket...");
    const { socket } = await initializeSocket(config, eventEmitter);

    // Handle pairing code if selected
    if (authMethod === "2") {
      const phoneNumber = await question(
        "\nEnter phone number (e.g., 6281234567890): ",
      );

      setTimeout(async () => {
        try {
          const code = await requestPairingCode(socket, phoneNumber);
          console.log(`\n🔐 Pairing Code: ${code}`);
          console.log(
            "Enter this code in WhatsApp > Settings > Linked Devices > Link a Device\n",
          );
        } catch (error) {
          console.error("❌ Failed to get pairing code:", error);
        }
      }, 3000);
    }

    console.log("✅ Socket initialized! Waiting for connection...");
    console.log("Press Ctrl+C to exit.\n");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n👋 Shutting down...");

      try {
        socket.end(undefined);
        await eventEmitter.close();
        rl.close();
        console.log("✅ Cleanup complete");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during cleanup:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Demo failed:", error);
    rl.close();
    process.exit(1);
  }
}

// Run demo jika file ini dijalankan langsung
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main as demoSocketInitializer };
