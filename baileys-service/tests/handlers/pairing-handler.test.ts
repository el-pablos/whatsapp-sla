import {
  PairingHandler,
  PhoneValidationResult,
} from "../../src/auth/pairing-handler";
import type { WASocket } from "@whiskeysockets/baileys";

// Mock WASocket
const createMockSocket = (
  options: {
    registered?: boolean;
    hasRequestPairingCode?: boolean;
    requestPairingCodeResult?: string;
    requestPairingCodeError?: Error;
  } = {},
): WASocket => {
  const {
    registered = false,
    hasRequestPairingCode = true,
    requestPairingCodeResult = "12345678",
    requestPairingCodeError = null,
  } = options;

  const mock = {
    authState: {
      creds: {
        registered,
      },
    },
    requestPairingCode: hasRequestPairingCode
      ? jest.fn().mockImplementation(async () => {
          if (requestPairingCodeError) {
            throw requestPairingCodeError;
          }
          return requestPairingCodeResult;
        })
      : undefined,
  } as unknown as WASocket;

  return mock;
};

describe("PairingHandler", () => {
  let handler: PairingHandler;

  beforeEach(() => {
    handler = new PairingHandler();
    jest.clearAllMocks();
  });

  afterEach(() => {
    handler.destroy();
  });

  describe("validatePhoneNumber", () => {
    test("should validate correct phone number", () => {
      const result: PhoneValidationResult =
        handler.validatePhoneNumber("6281234567890");
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe("6281234567890");
      expect(result.error).toBeUndefined();
    });

    test("should normalize phone number with special characters", () => {
      const result: PhoneValidationResult =
        handler.validatePhoneNumber("+62 812-3456-7890");
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe("6281234567890");
    });

    test("should reject phone number starting with 0", () => {
      const result: PhoneValidationResult =
        handler.validatePhoneNumber("081234567890");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("tidak boleh dimulai dengan 0");
    });

    test("should reject too short phone number", () => {
      const result: PhoneValidationResult =
        handler.validatePhoneNumber("628123456");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("terlalu pendek");
    });

    test("should reject too long phone number", () => {
      const result: PhoneValidationResult =
        handler.validatePhoneNumber("628123456789012345");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("terlalu panjang");
    });
  });

  describe("requestPairingCode", () => {
    test("should return error when socket not set", async () => {
      const result = await handler.requestPairingCode("6281234567890");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Socket belum di-set");
    });

    test("should return error for invalid phone number", async () => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      const result = await handler.requestPairingCode("081234567890");
      expect(result.success).toBe(false);
      expect(result.error).toContain("tidak boleh dimulai dengan 0");
    });

    test("should return error when credentials already registered", async () => {
      const sock = createMockSocket({ registered: true });
      handler.setSocket(sock);

      const result = await handler.requestPairingCode("6281234567890");
      expect(result.success).toBe(false);
      expect(result.error).toContain("sudah terdaftar");
    });

    test("should successfully request pairing code", async () => {
      const sock = createMockSocket({
        requestPairingCodeResult: "ABCD1234",
      });
      handler.setSocket(sock);

      // Listen for events
      const events: Array<{ name: string; data: any }> = [];
      handler.on("pairing:code", (data) =>
        events.push({ name: "pairing:code", data }),
      );
      handler.on("pairing:error", (data) =>
        events.push({ name: "pairing:error", data }),
      );

      const result = await handler.requestPairingCode("6281234567890");

      expect(result.success).toBe(true);
      expect(result.code).toBe("ABCD1234");
      expect(result.phoneNumber).toBe("6281234567890");
      expect(result.expiresAt).toBeGreaterThan(Date.now());

      // Check events
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe("pairing:code");
      expect(events[0].data.code).toBe("ABCD1234");

      // Check socket was called correctly
      expect(sock.requestPairingCode).toHaveBeenCalledWith("6281234567890");
    });

    test("should handle requestPairingCode error", async () => {
      const error = new Error("Network error");
      const sock = createMockSocket({
        requestPairingCodeError: error,
      });
      handler.setSocket(sock);

      const events: Array<{ name: string; data: any }> = [];
      handler.on("pairing:error", (data) =>
        events.push({ name: "pairing:error", data }),
      );

      const result = await handler.requestPairingCode("6281234567890");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");

      // Check events
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe("pairing:error");
      expect(events[0].data.error).toBe("Network error");
    });

    test("should handle missing requestPairingCode method", async () => {
      const sock = createMockSocket({ hasRequestPairingCode: false });
      handler.setSocket(sock);

      const result = await handler.requestPairingCode("6281234567890");

      expect(result.success).toBe(false);
      expect(result.error).toContain("TypeError");
    });
  });

  describe("getCurrentCode", () => {
    test("should return null when no pairing code", () => {
      expect(handler.getCurrentCode()).toBeNull();
    });

    test("should return current code when valid", async () => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      await handler.requestPairingCode("6281234567890");
      expect(handler.getCurrentCode()).toBe("12345678");
    });

    test("should return null when code expired", async () => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      await handler.requestPairingCode("6281234567890");

      // Manually expire the code by setting expiresAt to past
      const status = handler.getStatus();
      if (status.expiresAt) {
        // @ts-expect-error - Accessing private property for testing
        handler.pairingExpiresAt = Date.now() - 1000;
      }

      expect(handler.getCurrentCode()).toBeNull();
    });
  });

  describe("getStatus", () => {
    test("should return empty status initially", () => {
      const status = handler.getStatus();
      expect(status.hasPairingCode).toBe(false);
      expect(status.code).toBeNull();
      expect(status.phoneNumber).toBeNull();
      expect(status.remainingMs).toBe(0);
    });

    test("should return correct status after requesting code", async () => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      await handler.requestPairingCode("6281234567890");

      const status = handler.getStatus();
      expect(status.hasPairingCode).toBe(true);
      expect(status.code).toBe("12345678");
      expect(status.phoneNumber).toBe("6281234567890");
      expect(status.remainingMs).toBeGreaterThan(0);
    });
  });

  describe("clearPairingCode", () => {
    test("should clear all pairing state", async () => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      await handler.requestPairingCode("6281234567890");
      handler.clearPairingCode();

      const status = handler.getStatus();
      expect(status.hasPairingCode).toBe(false);
      expect(status.code).toBeNull();
      expect(handler.getCurrentCode()).toBeNull();
    });
  });

  describe("notifyPairingSuccess", () => {
    test("should emit success event and clear code", async () => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      await handler.requestPairingCode("6281234567890");

      const events: Array<{ name: string; data: any }> = [];
      handler.on("pairing:success", (data) =>
        events.push({ name: "pairing:success", data }),
      );

      handler.notifyPairingSuccess("6281234567890@c.us");

      expect(events).toHaveLength(1);
      expect(events[0].data.jid).toBe("6281234567890@c.us");
      expect(handler.getCurrentCode()).toBeNull();
    });
  });

  describe("isPairingCodeSupported", () => {
    test("should return false when no socket", () => {
      expect(handler.isPairingCodeSupported()).toBe(false);
    });

    test("should return true when socket has requestPairingCode method", () => {
      const sock = createMockSocket();
      handler.setSocket(sock);
      expect(handler.isPairingCodeSupported()).toBe(true);
    });

    test("should return false when socket missing requestPairingCode method", () => {
      const sock = createMockSocket({ hasRequestPairingCode: false });
      handler.setSocket(sock);
      expect(handler.isPairingCodeSupported()).toBe(false);
    });
  });

  describe("timeout handling", () => {
    test("should emit expired event when timeout", async (done) => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      // Override timeout untuk testing (100ms)
      // @ts-expect-error - Accessing private property for testing
      handler.PAIRING_TIMEOUT_MS = 100;

      handler.on("pairing:expired", (data) => {
        expect(data.phoneNumber).toBe("6281234567890");
        done();
      });

      await handler.requestPairingCode("6281234567890");
    });
  });

  describe("destroy", () => {
    test("should cleanup all resources", async () => {
      const sock = createMockSocket();
      handler.setSocket(sock);

      await handler.requestPairingCode("6281234567890");

      // Add some listeners
      const mockListener = jest.fn();
      handler.on("pairing:code", mockListener);

      handler.destroy();

      // Check state is cleared
      expect(handler.getCurrentCode()).toBeNull();
      expect(handler.isPairingCodeSupported()).toBe(false);

      // Check listeners are removed
      expect(handler.listenerCount("pairing:code")).toBe(0);
    });
  });
});
