/**
 * Test file untuk Socket Initializer
 *
 * Simple test untuk verifikasi implementasi tanpa koneksi WhatsApp
 */

import {
  initializeSocket,
  getBaileysVersion,
  requestPairingCode,
} from "../src/socket";
import { BaileysEventEmitter } from "../src/handlers/events";
import type { SocketConfig } from "../src/types";

describe("Socket Initializer", () => {
  const testSessionPath = "./test-sessions";

  const mockConfig: SocketConfig = {
    sessionPath: testSessionPath,
    browser: ["Test WhatsApp SLA", "Chrome", "1.0.0"],
  };

  beforeEach(() => {
    // Setup mock environment
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Cleanup test session
    const fs = require("fs");
    if (fs.existsSync(testSessionPath)) {
      fs.rmSync(testSessionPath, { recursive: true, force: true });
    }
  });

  test("should fetch Baileys version", async () => {
    const versionInfo = await getBaileysVersion();

    expect(versionInfo).toHaveProperty("version");
    expect(versionInfo).toHaveProperty("isLatest");
    expect(Array.isArray(versionInfo.version)).toBe(true);
    expect(versionInfo.version.length).toBe(3);
  });

  test("should validate session path configuration", async () => {
    const invalidConfig = {
      sessionPath: "",
    };

    await expect(
      initializeSocket(invalidConfig as SocketConfig),
    ).rejects.toThrow("Session path harus berupa string yang valid");
  });

  test("should create session directory if not exists", async () => {
    const fs = require("fs");

    // Ensure directory doesn't exist
    if (fs.existsSync(testSessionPath)) {
      fs.rmSync(testSessionPath, { recursive: true, force: true });
    }

    // Initialize socket (akan throw karena tidak ada koneksi, tapi directory harus terbuat)
    try {
      await initializeSocket(mockConfig);
    } catch (error) {
      // Expected error karena tidak ada koneksi WhatsApp
    }

    expect(fs.existsSync(testSessionPath)).toBe(true);
  });

  test("should create event emitter instance", () => {
    const eventEmitter = new BaileysEventEmitter();

    expect(eventEmitter).toBeInstanceOf(BaileysEventEmitter);
    expect(typeof eventEmitter.emitQRGenerated).toBe("function");
    expect(typeof eventEmitter.emitAuthSuccess).toBe("function");
    expect(typeof eventEmitter.emitConnectionStatus).toBe("function");
  });

  test("should validate phone number for pairing", async () => {
    // Mock socket object
    const mockSocket = {
      requestPairingCode: jest.fn().mockResolvedValue("123456"),
    } as any;

    // Test valid phone number
    const validNumber = "6281234567890";
    const result = await requestPairingCode(mockSocket, validNumber);

    expect(result).toBe("123456");
    expect(mockSocket.requestPairingCode).toHaveBeenCalledWith(validNumber);

    // Test invalid phone number
    const invalidNumber = "123";
    await expect(requestPairingCode(mockSocket, invalidNumber)).rejects.toThrow(
      "Nomor telepon tidak valid",
    );
  });
});
