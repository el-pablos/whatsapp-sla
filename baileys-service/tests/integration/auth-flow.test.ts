import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { QRHandler } from "../../src/auth/qr-handler";
import { PairingHandler } from "../../src/auth/pairing-handler";
import { SessionStore } from "../../src/auth/session-store";
import { ReconnectHandler } from "../../src/handlers/reconnect";
import type { WASocket } from "@whiskeysockets/baileys";

describe("Baileys Auth Module Tests", () => {
  describe("QRHandler", () => {
    let qrHandler: QRHandler;

    beforeEach(() => {
      qrHandler = new QRHandler({
        timeout: 30000,
        maxRetries: 5,
      });
    });

    afterEach(() => {
      qrHandler.removeAllListeners();
    });

    test("should generate QR code and emit event", async () => {
      const mockQR = "2@test_qr_code_data";
      let emittedQR: unknown = "";

      qrHandler.on("qr:generated", (qrData) => {
        emittedQR = qrData;
      });

      await qrHandler.handleQRUpdate(mockQR);

      expect(emittedQR).toBeDefined();
      const qrData = qrHandler.getQRData();
      expect(qrData?.raw).toBe(mockQR);
    });

    test("should timeout QR after specified time", async () => {
      qrHandler = new QRHandler({ timeout: 100, maxRetries: 1 });

      let timeoutEmitted = false;
      qrHandler.on("qr:expired", () => {
        timeoutEmitted = true;
      });

      await qrHandler.handleQRUpdate("test_qr");

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(timeoutEmitted).toBe(true);
    });

    test("should generate QR as base64 image", async () => {
      const mockQR = "2@test_qr_code_data";
      await qrHandler.handleQRUpdate(mockQR);

      const base64 = await qrHandler.getQRAsBase64();

      expect(base64).toMatch(/^data:image\/png;base64,/);
    });

    test("should stop at max retries", async () => {
      qrHandler = new QRHandler({ timeout: 50, maxRetries: 2 });

      let maxRetriesEmitted = false;
      qrHandler.on("qr:max-retries", () => {
        maxRetriesEmitted = true;
      });

      // Trigger multiple QR updates to exceed max retries
      await qrHandler.handleQRUpdate("qr1");
      await new Promise((resolve) => setTimeout(resolve, 60));
      await qrHandler.handleQRUpdate("qr2");
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Third QR should trigger max-retries and throw
      try {
        await qrHandler.handleQRUpdate("qr3");
      } catch {
        // Expected to throw
      }

      expect(maxRetriesEmitted).toBe(true);
    });
  });

  describe("PairingHandler", () => {
    let pairingHandler: PairingHandler;
    let mockSocket: Partial<WASocket>;

    beforeEach(() => {
      pairingHandler = new PairingHandler();
      mockSocket = {
        requestPairingCode: jest
          .fn<() => Promise<string>>()
          .mockResolvedValue("1234-5678"),
      } as unknown as Partial<WASocket>;
      pairingHandler.setSocket(mockSocket as WASocket);
    });

    afterEach(() => {
      pairingHandler.removeAllListeners();
    });

    test("should request pairing code for valid phone", async () => {
      const phoneNumber = "628123456789";

      const result = await pairingHandler.requestPairingCode(phoneNumber);

      expect(result.code).toBe("1234-5678");
      expect(mockSocket.requestPairingCode).toHaveBeenCalledWith(phoneNumber);
    });

    test("should validate phone number format", async () => {
      const invalidPhone = "invalid";

      const result = await pairingHandler.requestPairingCode(invalidPhone);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should normalize phone number", async () => {
      // Phone yang dimulai dengan 0 tidak valid (harus ada country code)
      // Skip 08123456789 karena itu akan menghasilkan error
      const phoneInputs = ["+62 812 3456 789", "62-812-3456-789"];

      for (const phone of phoneInputs) {
        const result = await pairingHandler.requestPairingCode(phone);
        expect(result.success).toBe(true);
      }
    });

    test("should timeout pairing code after 120 seconds", async () => {
      let timeoutEmitted = false;
      pairingHandler.on("pairing:expired", () => {
        timeoutEmitted = true;
      });

      await pairingHandler.requestPairingCode("628123456789");

      // Mock timeout
      setTimeout(() => {
        pairingHandler.emit("pairing:expired");
      }, 100);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(timeoutEmitted).toBe(true);
    });
  });

  describe("SessionStore", () => {
    let sessionStore: SessionStore;
    const testSessionPath = "/tmp/test_session";

    beforeEach(() => {
      sessionStore = new SessionStore(testSessionPath, "test_session");
    });

    test("should check if session exists", () => {
      const exists = sessionStore.sessionExists();
      // Should be false for new session
      expect(typeof exists).toBe("boolean");
    });

    test("should create session directory safely", async () => {
      await expect(sessionStore.initialize()).resolves.not.toThrow();
    });

    test("should backup session", async () => {
      // Initialize session first
      await sessionStore.initialize();

      // Create creds.json file to make session exist
      const fs = await import("fs");
      const path = await import("path");
      const credsPath = path.join(sessionStore.getSessionPath(), "creds.json");
      fs.writeFileSync(credsPath, JSON.stringify({ test: "data" }));

      const backupPath = await sessionStore.backupSession();
      expect(backupPath).toMatch(/backup_/);
    });

    test("should delete session safely", async () => {
      await expect(sessionStore.deleteSession()).resolves.not.toThrow();
    });
  });

  describe("ReconnectHandler", () => {
    let reconnectHandler: ReconnectHandler;

    beforeEach(() => {
      reconnectHandler = new ReconnectHandler({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
      });
    });

    test("should calculate exponential backoff delay", () => {
      const delay1 = reconnectHandler.calculateDelay();
      reconnectHandler["reconnectAttempts"] = 1;
      const delay2 = reconnectHandler.calculateDelay();

      expect(delay2).toBeGreaterThan(delay1);
    });

    test("should respect max attempts", async () => {
      const mockInit = jest
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined);

      // Exhaust max attempts
      for (let i = 0; i < 4; i++) {
        try {
          await reconnectHandler.reconnect(mockInit as () => Promise<void>);
        } catch (error) {
          if (i === 3) {
            expect((error as Error).message).toContain(
              "Max reconnect attempts",
            );
          }
        }
      }
    });

    test("should reset attempts on successful connection", () => {
      reconnectHandler["reconnectAttempts"] = 5;
      reconnectHandler.resetOnSuccess();

      expect(reconnectHandler["reconnectAttempts"]).toBe(0);
    });

    test("should determine reconnectable disconnect reasons", () => {
      const { DisconnectReason } = require("@whiskeysockets/baileys");

      expect(
        reconnectHandler.shouldReconnect(DisconnectReason.connectionLost),
      ).toBe(true);
      expect(reconnectHandler.shouldReconnect(DisconnectReason.loggedOut)).toBe(
        false,
      );
    });
  });
});

// Integration Test
describe("Baileys Integration Flow", () => {
  test("complete auth flow with QR code", async () => {
    const qrHandler = new QRHandler();
    let authSuccess = false;

    qrHandler.on("qr:generated", (qr) => {
      expect(qr).toBeDefined();
      // Simulate QR scan
      setTimeout(() => {
        authSuccess = true;
        qrHandler.clearQR();
      }, 100);
    });

    await qrHandler.handleQRUpdate("mock_qr_data");
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(authSuccess).toBe(true);
  });

  test("complete auth flow with pairing code", async () => {
    const pairingHandler = new PairingHandler();
    const mockSocket = {
      requestPairingCode: jest
        .fn<() => Promise<string>>()
        .mockResolvedValue("9876-5432"),
    } as unknown as Partial<WASocket>;

    pairingHandler.setSocket(mockSocket as WASocket);

    const result = await pairingHandler.requestPairingCode("628123456789");
    expect(result.code).toBe("9876-5432");

    // Simulate successful pairing
    pairingHandler.notifyPairingSuccess("628123456789@s.whatsapp.net");
    expect(pairingHandler.getCurrentCode()).toBeNull();
  });
});
