import { DisconnectReason } from "@whiskeysockets/baileys";
import { ReconnectHandler } from "../../src/handlers/reconnect";

describe("ReconnectHandler", () => {
  let handler: ReconnectHandler;
  let mockInitSocket: jest.Mock;

  beforeEach(() => {
    handler = new ReconnectHandler();
    mockInitSocket = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("shouldReconnect", () => {
    test("should return true for reconnectable reasons", () => {
      const reconnectableReasons = [
        DisconnectReason.connectionClosed,
        DisconnectReason.connectionLost,
        DisconnectReason.timedOut,
        DisconnectReason.restartRequired,
        DisconnectReason.connectionReplaced,
      ];

      reconnectableReasons.forEach((reason) => {
        expect(handler.shouldReconnect(reason)).toBe(true);
      });
    });

    test("should return false for permanent failure reasons", () => {
      const permanentReasons = [
        DisconnectReason.loggedOut,
        DisconnectReason.badSession,
        DisconnectReason.forbidden,
        DisconnectReason.unavailableService,
      ];

      permanentReasons.forEach((reason) => {
        expect(handler.shouldReconnect(reason)).toBe(false);
      });
    });

    test("should return true for unknown reasons (default behavior)", () => {
      const unknownReason = 999 as DisconnectReason;
      expect(handler.shouldReconnect(unknownReason)).toBe(true);
    });
  });

  describe("calculateDelay", () => {
    test("should calculate exponential backoff correctly", () => {
      // First attempt
      const delay1 = handler.calculateDelay();
      expect(delay1).toBeGreaterThanOrEqual(1000); // baseDelay + jitter
      expect(delay1).toBeLessThan(1500); // baseDelay + max jitter

      // Simulate failed attempt
      handler["reconnectAttempts"] = 1;
      const delay2 = handler.calculateDelay();
      expect(delay2).toBeGreaterThanOrEqual(2000); // 2 * baseDelay
      expect(delay2).toBeLessThan(2500);

      // Test max delay cap
      handler["reconnectAttempts"] = 10;
      const delay3 = handler.calculateDelay();
      expect(delay3).toBeLessThanOrEqual(60500); // maxDelay + max jitter
    });

    test("should add jitter to prevent thundering herd", () => {
      const delays = [];
      for (let i = 0; i < 10; i++) {
        handler.reset();
        delays.push(handler.calculateDelay());
      }

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe("reconnect", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    test("should successfully reconnect with delay", async () => {
      mockInitSocket.mockResolvedValueOnce(undefined);

      const reconnectPromise = handler.reconnect(mockInitSocket);

      // Fast-forward timer
      jest.advanceTimersByTime(2000);
      await reconnectPromise;

      expect(mockInitSocket).toHaveBeenCalledTimes(1);
      expect(handler.getStats().currentAttempts).toBe(1);
    });

    test("should throw error when max attempts reached", async () => {
      // Set attempts to max - 1
      handler["reconnectAttempts"] = handler["maxAttempts"];

      await expect(handler.reconnect(mockInitSocket)).rejects.toThrow(
        "Max reconnect attempts (10) reached. Giving up.",
      );

      expect(mockInitSocket).not.toHaveBeenCalled();
    });

    test("should increment attempts counter", async () => {
      mockInitSocket.mockResolvedValueOnce(undefined);

      const reconnectPromise = handler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(2000);
      await reconnectPromise;

      expect(handler.getStats().currentAttempts).toBe(1);
    });

    test("should propagate initSocket errors", async () => {
      const error = new Error("Connection failed");
      mockInitSocket.mockRejectedValueOnce(error);

      const reconnectPromise = handler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(2000);

      await expect(reconnectPromise).rejects.toThrow("Connection failed");
      expect(handler.getStats().currentAttempts).toBe(1);
    });

    test("should respect custom options", async () => {
      const customHandler = new ReconnectHandler({
        maxAttempts: 5,
        baseDelay: 500,
        maxDelay: 30000,
      });

      // Test max attempts
      customHandler["reconnectAttempts"] = 5;
      await expect(customHandler.reconnect(mockInitSocket)).rejects.toThrow(
        "Max reconnect attempts (5) reached",
      );
    });
  });

  describe("resetOnSuccess", () => {
    test("should reset attempts counter and update timestamps", () => {
      // Simulate failed attempts
      handler["reconnectAttempts"] = 3;

      handler.resetOnSuccess();

      expect(handler.getStats().currentAttempts).toBe(0);
      expect(handler.getStats().lastSuccessfulConnection).toBeInstanceOf(Date);
      expect(handler.getStats().connectionHistory).toHaveLength(1);
    });

    test("should maintain connection history limit", () => {
      // Add 12 connections (should keep only last 10)
      for (let i = 0; i < 12; i++) {
        handler.resetOnSuccess();
      }

      expect(handler.getStats().connectionHistory).toHaveLength(10);
    });
  });

  describe("getStats", () => {
    test("should return current statistics", () => {
      handler["reconnectAttempts"] = 3;
      handler.resetOnSuccess();

      const stats = handler.getStats();

      expect(stats).toEqual({
        currentAttempts: 0,
        maxAttempts: 10,
        lastSuccessfulConnection: expect.any(Date),
        connectionHistory: expect.arrayContaining([expect.any(Date)]),
        attemptsRemaining: 10,
      });
    });
  });

  describe("isConnectionHealthy", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    test("should return true with insufficient data", () => {
      for (let i = 0; i < 3; i++) {
        handler.resetOnSuccess();
      }

      expect(handler.isConnectionHealthy()).toBe(true);
    });

    test("should return false with too many recent connections", () => {
      const now = new Date();
      jest.setSystemTime(now);

      // Add 6 connections in the last minute
      for (let i = 0; i < 6; i++) {
        handler.resetOnSuccess();
        jest.advanceTimersByTime(30000); // 30 seconds
      }

      expect(handler.isConnectionHealthy()).toBe(false);
    });

    test("should return true with old connections", () => {
      const now = new Date();
      jest.setSystemTime(now);

      // Add connections more than 5 minutes ago
      for (let i = 0; i < 6; i++) {
        handler.resetOnSuccess();
      }

      // Advance time by 6 minutes
      jest.advanceTimersByTime(6 * 60 * 1000);

      expect(handler.isConnectionHealthy()).toBe(true);
    });
  });

  describe("reset", () => {
    test("should reset all state", () => {
      handler["reconnectAttempts"] = 5;
      handler.resetOnSuccess();

      handler.reset();

      const stats = handler.getStats();
      expect(stats.currentAttempts).toBe(0);
      expect(stats.lastSuccessfulConnection).toBeNull();
      expect(stats.connectionHistory).toHaveLength(0);
    });
  });

  describe("parseDisconnectReason", () => {
    test("should parse Boom error correctly", () => {
      const boomError = {
        output: {
          statusCode: DisconnectReason.connectionLost,
        },
      };

      const reason = ReconnectHandler.parseDisconnectReason(boomError);
      expect(reason).toBe(DisconnectReason.connectionLost);
    });

    test("should handle non-Boom errors", () => {
      const regularError = new Error("Some error");
      const reason = ReconnectHandler.parseDisconnectReason(regularError);
      expect(reason).toBeNull();
    });

    test("should handle errors with output.statusCode", () => {
      const errorWithStatus = {
        output: {
          statusCode: DisconnectReason.loggedOut,
        },
      };

      const reason = ReconnectHandler.parseDisconnectReason(errorWithStatus);
      expect(reason).toBe(DisconnectReason.loggedOut);
    });

    test("should return null for errors without statusCode", () => {
      const errorWithoutStatus = { message: "Some error" };
      const reason = ReconnectHandler.parseDisconnectReason(errorWithoutStatus);
      expect(reason).toBeNull();
    });
  });

  describe("integration scenarios", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    test("should handle multiple reconnect cycles", async () => {
      mockInitSocket
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce(undefined);

      // First attempt fails
      let reconnectPromise = handler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(2000);
      await expect(reconnectPromise).rejects.toThrow("Fail 1");

      // Second attempt fails
      reconnectPromise = handler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(4000);
      await expect(reconnectPromise).rejects.toThrow("Fail 2");

      // Third attempt succeeds
      reconnectPromise = handler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(8000);
      await reconnectPromise;

      expect(mockInitSocket).toHaveBeenCalledTimes(3);
      expect(handler.getStats().currentAttempts).toBe(3);

      // Reset after success
      handler.resetOnSuccess();
      expect(handler.getStats().currentAttempts).toBe(0);
    });

    test("should respect disconnect reasons in full workflow", () => {
      // Should not reconnect for permanent failures
      expect(handler.shouldReconnect(DisconnectReason.loggedOut)).toBe(false);
      expect(handler.shouldReconnect(DisconnectReason.badSession)).toBe(false);

      // Should reconnect for temporary issues
      expect(handler.shouldReconnect(DisconnectReason.connectionLost)).toBe(
        true,
      );
      expect(handler.shouldReconnect(DisconnectReason.timedOut)).toBe(true);
    });
  });
});
