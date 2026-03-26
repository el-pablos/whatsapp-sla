/**
 * Baileys Service Startup Script
 *
 * Entry point untuk menjalankan Baileys service dengan API server.
 * Ini adalah file yang akan dijalankan di production.
 */

import { createConnectionManager } from "./core/connection-manager";
import { createApiServer } from "./api";
import { loadConfig } from "./config";

// Graceful shutdown handler
let shuttingDown = false;

async function main() {
  console.log("🚀 Starting Baileys Service...");

  // Load configuration
  const config = loadConfig();
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);

  // Create connection manager
  const sessionId = process.env.BAILEYS_SESSION_ID || "default";
  const connectionManager = createConnectionManager({
    sessionId,
    sessionBasePath: process.env.BAILEYS_SESSION_PATH || "./sessions",
    redisUrl: process.env.REDIS_URL,
    enableQR: true,
    enablePairing: true,
    reconnectOptions: {
      maxAttempts: config.retry.maxRetries,
      baseDelay: config.retry.baseDelayMs,
      maxDelay: config.retry.maxDelayMs,
    },
    qrOptions: {
      timeout: 60000,
      maxRetries: 5,
    },
  });

  console.log(`📱 Session ID: ${sessionId}`);

  // Setup connection event handlers
  connectionManager.on("connection:status", (status) => {
    console.log(`🔗 Connection Status: ${status}`);
  });

  connectionManager.on("connection:qr", (qr, attempt) => {
    console.log(`📲 QR Code generated (attempt ${attempt})`);
    console.log("   Scan this QR code with WhatsApp to authenticate");
  });

  connectionManager.on("connection:authenticated", (jid) => {
    console.log(`✅ Authenticated as: ${jid}`);
  });

  connectionManager.on("connection:error", (error, context) => {
    console.error(`❌ Error [${context}]:`, error.message);
  });

  connectionManager.on("message:received", (message) => {
    console.log(`📨 Message received from: ${message.key?.remoteJid}`);
  });

  // Create and start API server
  const apiPort = parseInt(process.env.BAILEYS_API_PORT || "3001", 10);
  const apiHost = process.env.BAILEYS_API_HOST || "0.0.0.0";

  const apiServer = createApiServer(connectionManager, {
    port: apiPort,
    host: apiHost,
    enableCors: true,
    enableLogging: process.env.NODE_ENV !== "test",
    enableSecurity: process.env.NODE_ENV === "production",
  });

  try {
    // Start API server first
    const serverInfo = await apiServer.start();
    console.log(`\n🌐 API Server: ${serverInfo.baseUrl}`);
    console.log("📊 Health Endpoints:");
    console.log(`   - Live:       ${serverInfo.baseUrl}/health/live`);
    console.log(`   - Ready:      ${serverInfo.baseUrl}/health/ready`);
    console.log(`   - Health:     ${serverInfo.baseUrl}/health/health`);
    console.log(`   - Connection: ${serverInfo.baseUrl}/health/connection`);
    console.log(`   - Metrics:    ${serverInfo.baseUrl}/health/metrics`);

    // Auto-connect if existing session
    const sessionInfo = await connectionManager.getSessionInfo();
    if (sessionInfo.sessionExists) {
      console.log("\n🔄 Found existing session, attempting to reconnect...");
      try {
        await connectionManager.connectWithQR();
      } catch (error) {
        console.log("⚠️  Auto-reconnect failed, waiting for manual connection");
      }
    } else {
      console.log(
        "\n⏳ No existing session, waiting for authentication request...",
      );
      console.log("   Use QR or Pairing Code via API to authenticate");
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n📦 Received ${signal}, shutting down gracefully...`);

    try {
      await apiServer.stop();
      await connectionManager.disconnect();
      await connectionManager.destroy();
      console.log("✅ Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Run main
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
