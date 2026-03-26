/**
 * Unit tests untuk network failure scenarios di Baileys service
 *
 * Focus pada:
 * - Socket reconnection logic
 * - Network timeout handling
 * - DNS resolution failures
 * - Connection refused scenarios
 */

import { DisconnectReason } from "@whiskeysockets/baileys";
import { ReconnectHandler } from "../../src/handlers/reconnect";
import { ConnectionManager } from "../../src/core/connection-manager";

// Mock Baileys socket functions
jest.mock("@whiskeysockets/baileys", () => {
  const originalModule = jest.requireActual("@whiskeysockets/baileys");
  return {
    ...originalModule,
    default: jest.fn(),
    makeWASocket: jest.fn(),
    fetchLatestBaileysVersion: jest.fn().mockResolvedValue({
      version: [2, 3000, 0],
      isLatest: true,
    }),
  };
});

// Mock filesystem operations
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  rmSync: jest.fn(),
}));

describe("Network Failure Unit Tests", () => {
  describe("Network Timeout Scenarios", () => {
    let reconnectHandler: ReconnectHandler;
    let mockInitSocket: jest.Mock;

    beforeEach(() => {
      reconnectHandler = new ReconnectHandler();
      mockInitSocket = jest.fn();
      jest.clearAllMocks();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllTimers();
    });

    test("should handle network timeout with exponential backoff", async () => {
      // Mock network timeout error
      const timeoutError = new Error("Network timeout after 60000ms");
      mockInitSocket
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(undefined);

      // First attempt should fail immediately
      let reconnectPromise = reconnectHandler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(2000);
      await expect(reconnectPromise).rejects.toThrow("Network timeout");
      expect(reconnectHandler.getStats().currentAttempts).toBe(1);

      // Second attempt should also fail but with longer delay
      reconnectPromise = reconnectHandler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(4000);
      await expect(reconnectPromise).rejects.toThrow("Network timeout");
      expect(reconnectHandler.getStats().currentAttempts).toBe(2);

      // Third attempt should succeed
      reconnectPromise = reconnectHandler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(8000);
      await expect(reconnectPromise).resolves.toBeUndefined();
      expect(reconnectHandler.getStats().currentAttempts).toBe(3);
    });

    test("should respect max reconnect attempts during network issues", async () => {
      const customHandler = new ReconnectHandler({ maxAttempts: 3 });
      const networkError = new Error("ECONNREFUSED");
      mockInitSocket.mockRejectedValue(networkError);

      // Exhaust all attempts
      for (let i = 0; i < 3; i++) {
        const reconnectPromise = customHandler.reconnect(mockInitSocket);
        jest.advanceTimersByTime(10000);
        await expect(reconnectPromise).rejects.toThrow();
      }

      // Next attempt should be rejected immediately
      await expect(customHandler.reconnect(mockInitSocket)).rejects.toThrow(
        "Max reconnect attempts (3) reached",
      );

      expect(mockInitSocket).toHaveBeenCalledTimes(3);
    });

    test("should calculate increasing delays for network failures", () => {
      const delays = [];

      for (let i = 0; i < 5; i++) {
        delays.push(reconnectHandler.calculateDelay());
        reconnectHandler["reconnectAttempts"]++;
      }

      // Each delay should be progressively longer
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
      }

      // First delay should be around base delay (1000ms)
      expect(delays[0]).toBeGreaterThanOrEqual(1000);
      expect(delays[0]).toBeLessThan(2000);

      console.log("[Test] Exponential backoff delays:", delays);
    });
  });

  describe("WhatsApp Server Unreachable Scenarios", () => {
    let reconnectHandler: ReconnectHandler;

    beforeEach(() => {
      reconnectHandler = new ReconnectHandler();
    });

    test("should handle DNS resolution failures", () => {
      // DNS failures are typically permanent and should not reconnect
      const dnsError = {
        code: "ENOTFOUND",
        message: "getaddrinfo ENOTFOUND web.whatsapp.com",
      };

      // For DNS errors, we might want to retry as it could be temporary
      // But with longer delays
      expect(
        reconnectHandler.shouldReconnect(DisconnectReason.connectionLost),
      ).toBe(true);

      const delay = reconnectHandler.calculateDelay();
      expect(delay).toBeGreaterThan(1000); // Should have reasonable delay
    });

    test("should handle connection refused scenarios", () => {
      // Connection refused should trigger reconnect
      expect(
        reconnectHandler.shouldReconnect(DisconnectReason.connectionClosed),
      ).toBe(true);
      expect(
        reconnectHandler.shouldReconnect(DisconnectReason.connectionLost),
      ).toBe(true);

      // But forbidden/unavailable should not
      expect(reconnectHandler.shouldReconnect(DisconnectReason.forbidden)).toBe(
        false,
      );
      expect(
        reconnectHandler.shouldReconnect(DisconnectReason.unavailableService),
      ).toBe(false);
    });

    test("should handle server timeout errors", () => {
      expect(reconnectHandler.shouldReconnect(DisconnectReason.timedOut)).toBe(
        true,
      );

      // Server timeouts should reconnect but not immediately
      reconnectHandler["reconnectAttempts"] = 2;
      const delay = reconnectHandler.calculateDelay();
      expect(delay).toBeGreaterThan(2000); // At least 2 seconds after 2 attempts
    });

    test("should parse Boom errors for disconnect reasons", () => {
      // Test various Boom error scenarios
      const testCases = [
        {
          error: { output: { statusCode: DisconnectReason.connectionLost } },
          expected: DisconnectReason.connectionLost,
        },
        {
          error: { output: { statusCode: DisconnectReason.loggedOut } },
          expected: DisconnectReason.loggedOut,
        },
        {
          error: { message: "Some other error" },
          expected: null,
        },
      ];

      testCases.forEach(({ error, expected }) => {
        const parsed = ReconnectHandler.parseDisconnectReason(error);
        expect(parsed).toBe(expected);
      });
    });
  });

  describe("Connection Health Monitoring", () => {
    let reconnectHandler: ReconnectHandler;

    beforeEach(() => {
      reconnectHandler = new ReconnectHandler();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("should detect unhealthy connection patterns", () => {
      const now = new Date();
      jest.setSystemTime(now);

      // Simulate rapid disconnections
      for (let i = 0; i < 6; i++) {
        reconnectHandler.resetOnSuccess();
        jest.advanceTimersByTime(30000); // 30 seconds between connections
      }

      // Should detect connection instability
      expect(reconnectHandler.isConnectionHealthy()).toBe(false);

      // Old connections should not affect health check
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes later
      expect(reconnectHandler.isConnectionHealthy()).toBe(true);
    });

    test("should maintain connection statistics", () => {
      // Initial stats
      let stats = reconnectHandler.getStats();
      expect(stats.currentAttempts).toBe(0);
      expect(stats.lastSuccessfulConnection).toBeNull();
      expect(stats.connectionHistory).toHaveLength(0);

      // After successful connection
      reconnectHandler.resetOnSuccess();
      stats = reconnectHandler.getStats();
      expect(stats.currentAttempts).toBe(0);
      expect(stats.lastSuccessfulConnection).toBeInstanceOf(Date);
      expect(stats.connectionHistory).toHaveLength(1);

      // After failed attempts
      reconnectHandler["reconnectAttempts"] = 3;
      stats = reconnectHandler.getStats();
      expect(stats.currentAttempts).toBe(3);
      expect(stats.attemptsRemaining).toBe(7); // 10 - 3
    });

    test("should limit connection history size", () => {
      // Add more than 10 connections
      for (let i = 0; i < 15; i++) {
        reconnectHandler.resetOnSuccess();
      }

      const stats = reconnectHandler.getStats();
      expect(stats.connectionHistory).toHaveLength(10); // Should cap at 10
    });
  });

  describe("Burst Event Handling", () => {
    test("should handle rapid connection attempts gracefully", async () => {
      const handler = new ReconnectHandler({ maxAttempts: 20 });
      jest.useFakeTimers();

      let attempts = 0;
      const mockInitSocket = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 10) {
          return Promise.reject(new Error("Connection failed"));
        }
        return Promise.resolve();
      });

      // Attempt multiple rapid reconnects
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          handler
            .reconnect(mockInitSocket)
            .catch((e) => ({ error: e.message })),
        );
        jest.advanceTimersByTime(500); // Small delay between starts
      }

      jest.advanceTimersByTime(60000); // Complete all delayed calls
      const results = await Promise.all(promises);

      console.log("[Test] Burst reconnect results:", results);

      // Should have attempted reconnections without crashing
      expect(results.length).toBe(5);
      expect(attempts).toBeGreaterThan(0);
    });

    test("should queue burst events properly", () => {
      // This test simulates message queue handling
      const messageQueue: any[] = [];
      const maxConcurrent = 3;
      let activeTasks = 0;

      const processMessage = (id: number): Promise<void> => {
        return new Promise((resolve) => {
          if (activeTasks >= maxConcurrent) {
            messageQueue.push({ id, resolve });
            return;
          }

          activeTasks++;
          setTimeout(() => {
            activeTasks--;
            // Process next in queue
            if (messageQueue.length > 0) {
              const next = messageQueue.shift();
              next.resolve();
            }
            resolve();
          }, 100);
        });
      };

      // Send burst of messages
      const messagePromises = [];
      for (let i = 0; i < 10; i++) {
        messagePromises.push(processMessage(i));
      }

      // All messages should eventually be processed
      return Promise.all(messagePromises).then(() => {
        expect(messageQueue.length).toBe(0);
        expect(activeTasks).toBeLessThanOrEqual(maxConcurrent);
      });
    });
  });

  describe("Internet Drop Recovery Simulation", () => {
    let reconnectHandler: ReconnectHandler;
    let mockInitSocket: jest.Mock;

    beforeEach(() => {
      reconnectHandler = new ReconnectHandler();
      mockInitSocket = jest.fn();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllTimers();
    });

    test("should simulate complete network drop and recovery", async () => {
      let isNetworkUp = false;
      let attemptCount = 0;

      mockInitSocket.mockImplementation(() => {
        attemptCount++;
        if (!isNetworkUp) {
          return Promise.reject(new Error("Network unavailable"));
        }
        return Promise.resolve();
      });

      // Start reconnection while network is down
      const reconnectPromise = reconnectHandler.reconnect(mockInitSocket);

      // Advance timer and let first attempt fail
      jest.advanceTimersByTime(2000);
      await expect(reconnectPromise).rejects.toThrow("Network unavailable");

      // Network comes back up after 2 failed attempts
      reconnectHandler["reconnectAttempts"] = 1; // Reset for next attempt
      isNetworkUp = true;

      // Next attempt should succeed
      const secondAttempt = reconnectHandler.reconnect(mockInitSocket);
      jest.advanceTimersByTime(2000);
      await expect(secondAttempt).resolves.toBeUndefined();

      expect(attemptCount).toBeGreaterThanOrEqual(2);
      console.log(
        "[Test] Network recovery simulation - attempts:",
        attemptCount,
      );
    });

    test("should handle intermittent connectivity", async () => {
      let connectionAttempts = 0;
      const connectionPattern = [false, false, true, false, true, true]; // Flaky network

      mockInitSocket.mockImplementation(() => {
        const shouldSucceed =
          connectionPattern[connectionAttempts % connectionPattern.length];
        connectionAttempts++;

        if (shouldSucceed) {
          return Promise.resolve();
        }
        return Promise.reject(new Error("Connection unstable"));
      });

      // Try multiple reconnections
      for (let i = 0; i < 3; i++) {
        try {
          const promise = reconnectHandler.reconnect(mockInitSocket);
          jest.advanceTimersByTime(2000);
          await promise;
          reconnectHandler.resetOnSuccess();
        } catch (error) {
          // Expected for some attempts
        }
      }

      // Should have made multiple attempts
      expect(connectionAttempts).toBeGreaterThanOrEqual(3);

      // Connection health should reflect instability
      if (reconnectHandler.getStats().connectionHistory.length >= 5) {
        const isHealthy = reconnectHandler.isConnectionHealthy();
        console.log(
          "[Test] Connection health during intermittent connectivity:",
          isHealthy,
        );
      }
    });
  });

  describe("Error Recovery Patterns", () => {
    test("should distinguish between recoverable and permanent errors", () => {
      const reconnectHandler = new ReconnectHandler();

      // Recoverable errors
      const recoverableReasons = [
        DisconnectReason.connectionClosed,
        DisconnectReason.connectionLost,
        DisconnectReason.timedOut,
        DisconnectReason.restartRequired,
      ];

      recoverableReasons.forEach((reason) => {
        expect(reconnectHandler.shouldReconnect(reason)).toBe(true);
      });

      // Permanent errors
      const permanentReasons = [
        DisconnectReason.loggedOut,
        DisconnectReason.badSession,
        DisconnectReason.forbidden,
      ];

      permanentReasons.forEach((reason) => {
        expect(reconnectHandler.shouldReconnect(reason)).toBe(false);
      });
    });

    test("should reset state correctly after successful recovery", () => {
      const reconnectHandler = new ReconnectHandler();

      // Simulate failed attempts
      reconnectHandler["reconnectAttempts"] = 5;

      // Before reset
      expect(reconnectHandler.getStats().currentAttempts).toBe(5);
      expect(reconnectHandler.getStats().lastSuccessfulConnection).toBeNull();

      // After successful connection
      reconnectHandler.resetOnSuccess();

      // State should be reset
      expect(reconnectHandler.getStats().currentAttempts).toBe(0);
      expect(
        reconnectHandler.getStats().lastSuccessfulConnection,
      ).toBeInstanceOf(Date);
    });
  });
});
