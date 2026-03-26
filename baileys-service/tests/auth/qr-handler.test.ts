import { QRHandler, QRData } from "../../src/auth/qr-handler";

// Mock QRCode module
jest.mock("qrcode", () => ({
  toDataURL: jest
    .fn()
    .mockImplementation((data) =>
      Promise.resolve(`data:image/png;base64,mock_base64_${data.slice(-10)}`),
    ),
  toString: jest
    .fn()
    .mockImplementation((data) =>
      Promise.resolve(`Terminal QR for ${data.slice(-10)}`),
    ),
}));

describe("QRHandler", () => {
  let qrHandler: QRHandler;
  let mockLogger: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = jest.fn();
    qrHandler = new QRHandler({
      timeout: 5000, // 5s untuk test yang cepat
      maxRetries: 3,
      logger: mockLogger,
    });

    // Clear any pending timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    qrHandler.destroy();
    jest.useRealTimers();
  });

  describe("Construction", () => {
    it("should create with default options", () => {
      const handler = new QRHandler();
      expect(handler).toBeDefined();
      expect(handler.getAttemptCount()).toBe(0);
      handler.destroy();
    });

    it("should create with custom options", () => {
      const customLogger = jest.fn();
      const handler = new QRHandler({
        timeout: 10000,
        maxRetries: 5,
        logger: customLogger,
      });

      expect(handler).toBeDefined();
      handler.destroy();
    });
  });

  describe("handleQRUpdate", () => {
    it("should process first QR successfully", async () => {
      const qrString = "test-qr-string-12345";
      const result = await qrHandler.handleQRUpdate(qrString);

      expect(result).toMatchObject({
        raw: qrString,
        attempt: 1,
      });
      expect(result.base64).toContain("mock_base64");
      expect(result.terminal).toContain("Terminal QR");
      expect(result.generatedAt).toBeGreaterThan(0);
      expect(result.expiresAt).toBeGreaterThan(result.generatedAt);

      expect(mockLogger).toHaveBeenCalledWith(
        "info",
        "Processing QR code (attempt 1/3)",
      );
    });

    it("should emit qr:generated event", async () => {
      const eventSpy = jest.fn();
      qrHandler.on("qr:generated", eventSpy);

      const qrString = "test-qr-string-67890";
      await qrHandler.handleQRUpdate(qrString);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          raw: qrString,
          attempt: 1,
        }),
      );
    });

    it("should increment attempt count on multiple calls", async () => {
      await qrHandler.handleQRUpdate("qr1");
      expect(qrHandler.getAttemptCount()).toBe(1);

      await qrHandler.handleQRUpdate("qr2");
      expect(qrHandler.getAttemptCount()).toBe(2);

      await qrHandler.handleQRUpdate("qr3");
      expect(qrHandler.getAttemptCount()).toBe(3);
    });

    it("should reject after max retries exceeded", async () => {
      // Do max retries first
      await qrHandler.handleQRUpdate("qr1");
      await qrHandler.handleQRUpdate("qr2");
      await qrHandler.handleQRUpdate("qr3");

      // This should fail
      await expect(qrHandler.handleQRUpdate("qr4")).rejects.toThrow(
        "Max QR retries (3) exceeded",
      );

      expect(mockLogger).toHaveBeenCalledWith(
        "error",
        "Max QR retries (3) exceeded, giving up",
      );
    });

    it("should emit qr:max-retries event", async () => {
      const eventSpy = jest.fn();
      qrHandler.on("qr:max-retries", eventSpy);

      // Exhaust retries
      await qrHandler.handleQRUpdate("qr1");
      await qrHandler.handleQRUpdate("qr2");
      await qrHandler.handleQRUpdate("qr3");

      try {
        await qrHandler.handleQRUpdate("qr4");
      } catch {
        // Expected
      }

      expect(eventSpy).toHaveBeenCalled();
    });

    it("should reject if already authenticated", async () => {
      qrHandler.setAuthenticated(true);

      await expect(qrHandler.handleQRUpdate("qr1")).rejects.toThrow(
        "Already authenticated",
      );

      expect(mockLogger).toHaveBeenCalledWith(
        "warn",
        "QR received but already authenticated, ignoring",
      );
    });
  });

  describe("QR Retrieval", () => {
    beforeEach(async () => {
      await qrHandler.handleQRUpdate("test-qr-12345");
    });

    it("should return base64 QR", async () => {
      const base64 = await qrHandler.getQRAsBase64();
      expect(base64).toContain("data:image/png;base64,mock_base64");
    });

    it("should return terminal QR", async () => {
      const terminal = await qrHandler.getQRAsTerminal();
      expect(terminal).toContain("Terminal QR for");
    });

    it("should return null for base64 when no QR", async () => {
      qrHandler.clearQR();
      const base64 = await qrHandler.getQRAsBase64();
      expect(base64).toBeNull();
    });

    it("should return null for terminal when no QR", async () => {
      qrHandler.clearQR();
      const terminal = await qrHandler.getQRAsTerminal();
      expect(terminal).toBeNull();
    });

    it("should return full QR data", () => {
      const qrData = qrHandler.getQRData();
      expect(qrData).toMatchObject({
        raw: "test-qr-12345",
        attempt: 1,
      });
      expect(qrData?.base64).toBeDefined();
      expect(qrData?.terminal).toBeDefined();
    });
  });

  describe("QR Expiration", () => {
    beforeEach(async () => {
      await qrHandler.handleQRUpdate("test-qr-expire");
    });

    it("should validate QR as valid initially", () => {
      expect(qrHandler.isQRValid()).toBe(true);
    });

    it("should return remaining time", () => {
      const remaining = qrHandler.getRemainingTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(5000);
    });

    it("should mark QR as invalid after timeout", () => {
      jest.advanceTimersByTime(6000); // Advance past timeout

      expect(qrHandler.isQRValid()).toBe(false);
      expect(qrHandler.getRemainingTime()).toBe(0);
    });

    it("should emit qr:expired event on timeout", () => {
      const eventSpy = jest.fn();
      qrHandler.on("qr:expired", eventSpy);

      jest.advanceTimersByTime(5100); // Past timeout

      expect(eventSpy).toHaveBeenCalledWith(1);
      expect(mockLogger).toHaveBeenCalledWith("warn", "QR expired (attempt 1)");
    });

    it("should return null for expired QR base64", async () => {
      jest.advanceTimersByTime(6000);

      const base64 = await qrHandler.getQRAsBase64();
      expect(base64).toBeNull();

      expect(mockLogger).toHaveBeenCalledWith("warn", "QR has expired");
    });

    it("should return null for expired QR terminal", async () => {
      jest.advanceTimersByTime(6000);

      const terminal = await qrHandler.getQRAsTerminal();
      expect(terminal).toBeNull();

      expect(mockLogger).toHaveBeenCalledWith("warn", "QR has expired");
    });
  });

  describe("Authentication", () => {
    beforeEach(async () => {
      await qrHandler.handleQRUpdate("test-qr-auth");
    });

    it("should clear QR on successful authentication", () => {
      const eventSpy = jest.fn();
      qrHandler.on("qr:cleared", eventSpy);

      qrHandler.clearQR();

      expect(qrHandler.getQRData()).toBeNull();
      expect(qrHandler.isQRValid()).toBe(false);
      expect(eventSpy).toHaveBeenCalled();

      expect(mockLogger).toHaveBeenCalledWith(
        "info",
        "QR cleared - authentication successful",
      );
    });

    it("should set authenticated status", () => {
      qrHandler.setAuthenticated(true);
      expect(qrHandler.getQRData()).toBeNull();
    });
  });

  describe("Reset", () => {
    beforeEach(async () => {
      await qrHandler.handleQRUpdate("test-qr-reset");
    });

    it("should reset handler state", () => {
      qrHandler.reset();

      expect(qrHandler.getAttemptCount()).toBe(0);
      expect(qrHandler.getQRData()).toBeNull();
      expect(qrHandler.isQRValid()).toBe(false);

      expect(mockLogger).toHaveBeenCalledWith("info", "QR handler reset");
    });

    it("should allow new QR after reset", async () => {
      qrHandler.reset();

      const result = await qrHandler.handleQRUpdate("new-qr-after-reset");
      expect(result.attempt).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle QRCode generation errors", async () => {
      // Mock QRCode to throw error
      const QRCode = require("qrcode");
      QRCode.toDataURL.mockRejectedValueOnce(new Error("QR generation failed"));

      await expect(qrHandler.handleQRUpdate("failing-qr")).rejects.toThrow(
        "QR generation failed",
      );

      expect(mockLogger).toHaveBeenCalledWith(
        "error",
        "Failed to generate base64 QR: Error: QR generation failed",
      );
    });

    it("should handle terminal QR generation errors", async () => {
      // Mock untuk terminal generation
      const QRCode = require("qrcode");
      QRCode.toString.mockRejectedValueOnce(
        new Error("Terminal QR generation failed"),
      );

      await expect(
        qrHandler.handleQRUpdate("failing-terminal-qr"),
      ).rejects.toThrow("Terminal QR generation failed");

      expect(mockLogger).toHaveBeenCalledWith(
        "error",
        "Failed to generate terminal QR: Error: Terminal QR generation failed",
      );
    });
  });

  describe("Event Types", () => {
    it("should properly type events", () => {
      // TypeScript compilation test
      qrHandler.on("qr:generated", (data: QRData) => {
        expect(data.raw).toBeDefined();
      });

      qrHandler.on("qr:expired", (attempt: number) => {
        expect(typeof attempt).toBe("number");
      });

      qrHandler.on("qr:max-retries", () => {
        // No parameters
      });

      qrHandler.on("qr:cleared", () => {
        // No parameters
      });

      expect(true).toBe(true); // Test passes if no TypeScript errors
    });
  });

  describe("Cleanup", () => {
    it("should destroy properly", () => {
      const removeAllListenersSpy = jest.spyOn(qrHandler, "removeAllListeners");

      qrHandler.destroy();

      expect(removeAllListenersSpy).toHaveBeenCalled();
      expect(mockLogger).toHaveBeenCalledWith("info", "QR handler destroyed");
    });
  });
});
