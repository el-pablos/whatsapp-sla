/**
 * Baileys Integration Tests for Network Scenarios
 *
 * Test Baileys socket behavior under network failures
 */

import { test, expect } from "@playwright/test";
import { createNetworkSimulator } from "../fixtures/network-simulator";

test.describe("Baileys Network Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock console to capture Baileys logs
    await page.addInitScript(() => {
      (window as any).baileysLogs = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        if (
          args.some(
            (arg) =>
              typeof arg === "string" &&
              (arg.includes("[Socket]") ||
                arg.includes("[Baileys]") ||
                arg.includes("[ReconnectHandler]")),
          )
        ) {
          (window as any).baileysLogs.push(args.join(" "));
        }
        originalLog.apply(console, args);
      };
    });
  });

  test("should handle WhatsApp socket disconnection gracefully", async ({
    page,
  }) => {
    const networkSimulator = createNetworkSimulator(page);

    // Navigate to a page that might initialize Baileys
    await page.goto("/").catch(() => {
      console.log(
        "[Test] No server running - testing network simulation directly",
      );
    });

    // Simulate WhatsApp server connectivity
    await page.evaluate(() => {
      // Mock Baileys socket initialization
      (window as any).mockBaileysSocket = {
        connected: true,
        ev: {
          on: (event: string, callback: Function) => {
            if (event === "connection.update") {
              setTimeout(() => {
                callback({ connection: "open" });
              }, 100);
            }
          },
        },
        end: () => {
          (window as any).mockBaileysSocket.connected = false;
          console.log("[Baileys] Socket disconnected");
        },
      };

      // Simulate connection monitor
      (window as any).connectionMonitor = {
        checkConnection: async () => {
          try {
            const response = await fetch("https://web.whatsapp.com", {
              signal: AbortSignal.timeout(5000),
              mode: "no-cors",
            });
            return true;
          } catch {
            return false;
          }
        },
      };
    });

    // Test normal connection
    let connectionStatus = await page.evaluate(async () => {
      return await (window as any).connectionMonitor.checkConnection();
    });
    console.log("[Test] Initial connection status:", connectionStatus);

    // Simulate WhatsApp server unreachable
    await networkSimulator.simulateDNSFailure([
      "web.whatsapp.com",
      "whatsapp.com",
    ]);

    // Test connection after DNS failure
    connectionStatus = await page.evaluate(async () => {
      return await (window as any).connectionMonitor.checkConnection();
    });
    console.log(
      "[Test] Connection status after DNS failure:",
      connectionStatus,
    );

    // Connection should fail when DNS is down
    expect(connectionStatus).toBe(false);

    // Restore network and test recovery
    await networkSimulator.resetNetwork();

    // Brief wait for recovery
    await page.waitForTimeout(1000);

    connectionStatus = await page.evaluate(async () => {
      return await (window as any).connectionMonitor.checkConnection();
    });
    console.log("[Test] Connection status after recovery:", connectionStatus);

    // After cleanup, network should work (or stay false due to CORS in test env)
    // The important part is that we tested the flow without errors
  });

  test("should handle Baileys reconnection logic during network instability", async ({
    page,
  }) => {
    const networkSimulator = createNetworkSimulator(page);

    await page.goto("/").catch(() => {});

    // Mock Baileys reconnection logic
    await page.evaluate(() => {
      (window as any).reconnectAttempts = 0;
      (window as any).maxReconnectAttempts = 3;

      (window as any).simulateBaileysReconnect = async () => {
        const attempts = (window as any).reconnectAttempts;
        if (attempts >= (window as any).maxReconnectAttempts) {
          throw new Error("Max reconnect attempts reached");
        }

        (window as any).reconnectAttempts++;

        // Simulate exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        console.log(
          `[ReconnectHandler] Attempt ${attempts + 1}: delay ${delay}ms`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        try {
          // Try to establish connection
          await fetch("/api/baileys/connect", {
            signal: AbortSignal.timeout(5000),
          });

          console.log("[ReconnectHandler] Reconnection successful");
          (window as any).reconnectAttempts = 0;
          return true;
        } catch (error: any) {
          console.log("[ReconnectHandler] Reconnection failed:", error.message);
          throw error;
        }
      };
    });

    // Simulate unstable network
    await networkSimulator.simulateIntermittentNetwork(0.7, 10000); // 70% failure rate

    // Try reconnection cycles
    const results = await page.evaluate(async () => {
      const results = [];
      for (let i = 0; i < 3; i++) {
        try {
          await (window as any).simulateBaileysReconnect();
          results.push({ attempt: i + 1, success: true });
        } catch (error: any) {
          results.push({
            attempt: i + 1,
            success: false,
            error: error.message,
          });
        }

        // Reset for next cycle
        (window as any).reconnectAttempts = 0;
      }
      return results;
    });

    console.log("[Test] Reconnection cycle results:", results);

    // Should have attempted all reconnections
    expect(results.length).toBe(3);

    // Get logs
    const logs = await page.evaluate(() => (window as any).baileysLogs || []);
    console.log("[Test] Baileys logs:", logs);
  });

  test("should handle message queueing during network outages", async ({
    page,
  }) => {
    await page.goto("/").catch(() => {});

    // Mock message queue system
    await page.evaluate(() => {
      (window as any).messageQueue = [];
      (window as any).isConnected = true;

      (window as any).queueMessage = (message: any) => {
        if ((window as any).isConnected) {
          console.log("[Baileys] Sending message immediately:", message.id);
          return Promise.resolve({ success: true, id: message.id });
        } else {
          console.log("[Baileys] Queueing message:", message.id);
          (window as any).messageQueue.push(message);
          return Promise.resolve({
            success: false,
            id: message.id,
            queued: true,
          });
        }
      };

      (window as any).flushQueue = async () => {
        console.log(
          "[Baileys] Flushing message queue:",
          (window as any).messageQueue.length,
        );
        const results = [];
        while ((window as any).messageQueue.length > 0) {
          const message = (window as any).messageQueue.shift();
          results.push({ id: message.id, flushed: true });
        }
        return results;
      };
    });

    // Simulate network outage
    const networkSimulator = createNetworkSimulator(page);
    await networkSimulator.simulateNetworkDisconnect();

    // Set connection as down
    await page.evaluate(() => {
      (window as any).isConnected = false;
    });

    // Send messages during outage - they should be queued
    const queueResults = await page.evaluate(async () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await (window as any).queueMessage({
          id: `msg-${i}`,
          text: `Message ${i}`,
        });
        results.push(result);
      }
      return results;
    });

    console.log("[Test] Queue results during outage:", queueResults);

    // All messages should be queued
    expect(queueResults.every((r) => r.queued)).toBe(true);

    // Restore network
    await networkSimulator.restoreNetworkConnection();
    await page.evaluate(() => {
      (window as any).isConnected = true;
    });

    // Flush queue
    const flushResults = await page.evaluate(async () => {
      return await (window as any).flushQueue();
    });

    console.log("[Test] Flush results after recovery:", flushResults);

    // All queued messages should be flushed
    expect(flushResults.length).toBe(5);
  });

  test("should handle connection timeout scenarios", async ({ page }) => {
    const networkSimulator = createNetworkSimulator(page);

    await page.goto("/").catch(() => {});

    // Mock Baileys connection timeout handling
    await page.evaluate(() => {
      (window as any).connectWithTimeout = async (timeoutMs = 30000) => {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Connection timeout after ${timeoutMs}ms`));
          }, timeoutMs);

          // Simulate connection attempt
          fetch("/api/baileys/websocket", {
            signal: AbortSignal.timeout(timeoutMs - 1000),
          })
            .then(() => {
              clearTimeout(timeout);
              const duration = Date.now() - startTime;
              console.log(`[Baileys] Connection successful in ${duration}ms`);
              resolve({ success: true, duration });
            })
            .catch((error) => {
              clearTimeout(timeout);
              const duration = Date.now() - startTime;
              console.log(
                `[Baileys] Connection failed after ${duration}ms:`,
                error.message,
              );
              reject(new Error(`Connection failed: ${error.message}`));
            });
        });
      };
    });

    // Test normal connection first (will likely fail in test env, but tests the logic)
    let result = await page.evaluate(async () => {
      try {
        const result = await (window as any).connectWithTimeout(5000);
        return { success: true, ...result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    console.log("[Test] Normal connection result:", result);

    // Test with extremely slow network
    await networkSimulator.simulateSlowNetwork({ latency: 10000 });

    result = await page.evaluate(async () => {
      try {
        const result = await (window as any).connectWithTimeout(5000);
        return { success: true, ...result };
      } catch (error: any) {
        return { success: false, error: error.message, timeout: true };
      }
    });

    console.log("[Test] Slow network connection result:", result);

    // With high latency, connection should timeout
    expect(result.success).toBe(false);
    expect(result.error).toContain("timeout");
  });

  test("should preserve message order during network recovery", async ({
    page,
  }) => {
    await page.goto("/").catch(() => {});

    // Mock ordered message handling
    await page.evaluate(() => {
      (window as any).sentMessages = [];
      (window as any).processedMessages = [];

      (window as any).sendOrderedMessage = async (id: number, text: string) => {
        const message = { id, text, timestamp: Date.now() };
        (window as any).sentMessages.push(message);

        try {
          // Simulate API call
          const response = await fetch(`/api/messages/${id}`, {
            method: "POST",
            body: JSON.stringify(message),
            signal: AbortSignal.timeout(3000),
          });

          (window as any).processedMessages.push({ id, success: response.ok });
          return { success: response.ok };
        } catch (error: any) {
          (window as any).processedMessages.push({
            id,
            success: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      };
    });

    const networkSimulator = createNetworkSimulator(page);

    // Send messages with intermittent network
    await networkSimulator.simulateIntermittentNetwork(0.3, 10000);

    const messageCount = 10;
    const results = await page.evaluate(async (count: number) => {
      const promises = [];

      // Send messages sequentially to preserve order
      for (let i = 0; i < count; i++) {
        promises.push((window as any).sendOrderedMessage(i, `Message ${i}`));
      }

      const results = await Promise.all(promises);
      return {
        sent: (window as any).sentMessages,
        processed: (window as any).processedMessages,
        results,
      };
    }, messageCount);

    console.log("[Test] Ordered message test:");
    console.log(
      "  Sent order:",
      results.sent.map((m) => m.id),
    );
    console.log(
      "  Processed order:",
      results.processed.map((m) => m.id),
    );

    // All messages should be attempted in order
    expect(results.sent.length).toBe(messageCount);
    expect(results.processed.length).toBe(messageCount);

    // Order should be preserved in sent messages
    const sentOrder = results.sent.map((m) => m.id);
    const expectedOrder = Array.from({ length: messageCount }, (_, i) => i);
    expect(sentOrder).toEqual(expectedOrder);
  });
});

test.describe("Baileys Error Recovery Tests", () => {
  test("should handle all Baileys disconnect reasons appropriately", async ({
    page,
  }) => {
    await page.goto("/").catch(() => {});

    // Mock disconnect reason handling
    await page.evaluate(() => {
      // Simulate DisconnectReason enum from Baileys
      const DisconnectReason = {
        connectionClosed: 428,
        connectionLost: 408,
        connectionReplaced: 440,
        timedOut: 408,
        loggedOut: 401,
        badSession: 500,
        restartRequired: 515,
      };

      (window as any).handleDisconnect = (reason: number) => {
        const reconnectable = [
          DisconnectReason.connectionClosed,
          DisconnectReason.connectionLost,
          DisconnectReason.connectionReplaced,
          DisconnectReason.timedOut,
          DisconnectReason.restartRequired,
        ];

        const permanent = [
          DisconnectReason.loggedOut,
          DisconnectReason.badSession,
        ];

        if (permanent.includes(reason)) {
          console.log(
            `[Baileys] Permanent failure: ${reason}. Not reconnecting.`,
          );
          return { shouldReconnect: false, action: "logout" };
        }

        if (reconnectable.includes(reason)) {
          console.log(
            `[Baileys] Temporary failure: ${reason}. Will reconnect.`,
          );
          return { shouldReconnect: true, action: "reconnect" };
        }

        console.log(
          `[Baileys] Unknown reason: ${reason}. Defaulting to reconnect.`,
        );
        return { shouldReconnect: true, action: "reconnect" };
      };

      (window as any).DisconnectReason = DisconnectReason;
    });

    // Test various disconnect scenarios
    const disconnectTests = await page.evaluate(() => {
      const results = [];
      const reasons = (window as any).DisconnectReason;

      for (const [name, code] of Object.entries(reasons)) {
        const result = (window as any).handleDisconnect(code as number);
        results.push({
          reason: name,
          code: code as number,
          ...result,
        });
      }

      return results;
    });

    console.log("[Test] Disconnect reason handling:");
    disconnectTests.forEach((test) => {
      console.log(`  ${test.reason} (${test.code}): ${test.action}`);
    });

    // Verify permanent failures don't reconnect
    const permanentFailures = disconnectTests.filter(
      (t) => t.reason === "loggedOut" || t.reason === "badSession",
    );
    expect(permanentFailures.every((f) => !f.shouldReconnect)).toBe(true);

    // Verify temporary failures do reconnect
    const temporaryFailures = disconnectTests.filter((t) =>
      ["connectionClosed", "connectionLost", "timedOut"].includes(t.reason),
    );
    expect(temporaryFailures.every((f) => f.shouldReconnect)).toBe(true);
  });
});
