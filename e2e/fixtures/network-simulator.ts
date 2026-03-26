/**
 * Network Simulator untuk E2E Network Resilience Testing
 *
 * Menyediakan utilities untuk mensimulasikan berbagai kondisi network:
 * - Network disconnect/reconnect
 * - Slow network conditions
 * - Packet loss
 * - High latency
 * - DNS failures
 * - Server unreachable scenarios
 */

import { Page, Route } from "@playwright/test";

export interface NetworkCondition {
  downloadSpeed?: number; // KB/s
  uploadSpeed?: number; // KB/s
  latency?: number; // ms
  packetLoss?: number; // 0-1
}

export interface NetworkFailureSimulation {
  type:
    | "disconnect"
    | "timeout"
    | "dns-failure"
    | "connection-refused"
    | "slow";
  duration?: number; // ms
  condition?: NetworkCondition;
}

export class NetworkSimulator {
  private page: Page;
  private originalConditions: any = null;
  private interceptedRoutes: Map<string, Route[]> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Simulate complete network disconnect
   */
  async simulateNetworkDisconnect(): Promise<void> {
    console.log("[NetworkSimulator] Simulating network disconnect...");
    await this.page.route("**/*", (route) => {
      route.abort("internetdisconnected");
    });
  }

  /**
   * Restore network connection
   */
  async restoreNetworkConnection(): Promise<void> {
    console.log("[NetworkSimulator] Restoring network connection...");
    await this.page.unroute("**/*");
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork(condition: NetworkCondition = {}): Promise<void> {
    const defaultCondition = {
      downloadSpeed: 50, // 50 KB/s (very slow)
      uploadSpeed: 20, // 20 KB/s
      latency: 2000, // 2 seconds
      ...condition,
    };

    console.log(
      "[NetworkSimulator] Simulating slow network...",
      defaultCondition,
    );

    const cdp = await this.page.context().newCDPSession(this.page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: defaultCondition.downloadSpeed * 1024,
      uploadThroughput: defaultCondition.uploadSpeed * 1024,
      latency: defaultCondition.latency,
    });
  }

  /**
   * Simulate packet loss
   */
  async simulatePacketLoss(lossRate: number = 0.1): Promise<void> {
    console.log(
      `[NetworkSimulator] Simulating packet loss: ${lossRate * 100}%`,
    );

    await this.page.route("**/*", (route) => {
      if (Math.random() < lossRate) {
        route.abort("failed");
      } else {
        route.continue();
      }
    });
  }

  /**
   * Simulate DNS failure
   */
  async simulateDNSFailure(
    domains: string[] = ["web.whatsapp.com", "whatsapp.com"],
  ): Promise<void> {
    console.log("[NetworkSimulator] Simulating DNS failure for:", domains);

    for (const domain of domains) {
      await this.page.route(`**${domain}**`, (route) => {
        route.abort("namenotresolved");
      });
    }
  }

  /**
   * Simulate connection refused
   */
  async simulateConnectionRefused(
    patterns: string[] = ["**/baileys**", "**/whatsapp**"],
  ): Promise<void> {
    console.log(
      "[NetworkSimulator] Simulating connection refused for:",
      patterns,
    );

    for (const pattern of patterns) {
      await this.page.route(pattern, (route) => {
        route.abort("connectionrefused");
      });
    }
  }

  /**
   * Simulate timeout
   */
  async simulateTimeout(
    patterns: string[] = ["**/api/**"],
    delay: number = 30000,
  ): Promise<void> {
    console.log(
      `[NetworkSimulator] Simulating timeout for: ${patterns} with delay: ${delay}ms`,
    );

    for (const pattern of patterns) {
      await this.page.route(pattern, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        route.abort("timedout");
      });
    }
  }

  /**
   * Simulate burst events dengan queueing
   */
  async simulateBurstEventHandling(maxConcurrent: number = 3): Promise<void> {
    console.log(
      `[NetworkSimulator] Simulating burst event handling, max concurrent: ${maxConcurrent}`,
    );

    let activeRequests = 0;
    const requestQueue: (() => void)[] = [];

    await this.page.route("**/api/messages/**", async (route) => {
      if (activeRequests >= maxConcurrent) {
        // Queue the request
        await new Promise<void>((resolve) => {
          requestQueue.push(() => {
            activeRequests++;
            resolve();
          });
        });
      } else {
        activeRequests++;
      }

      // Simulate processing time
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 1000 + 500),
      );

      route.continue();

      activeRequests--;

      // Process next in queue
      if (requestQueue.length > 0) {
        const next = requestQueue.shift();
        next?.();
      }
    });
  }

  /**
   * Simulate intermittent network issues
   */
  async simulateIntermittentNetwork(
    failureRate: number = 0.2,
    duration: number = 60000,
  ): Promise<void> {
    console.log(
      `[NetworkSimulator] Simulating intermittent network, failure rate: ${failureRate * 100}%`,
    );

    const startTime = Date.now();

    await this.page.route("**/*", (route) => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        route.continue();
        return;
      }

      if (Math.random() < failureRate) {
        const failures = ["failed", "timedout", "connectionreset"];
        const randomFailure =
          failures[Math.floor(Math.random() * failures.length)];
        route.abort(randomFailure as any);
      } else {
        route.continue();
      }
    });
  }

  /**
   * Monitor network requests dan responses
   */
  async startNetworkMonitoring(): Promise<NetworkMonitor> {
    const monitor = new NetworkMonitor(this.page);
    await monitor.start();
    return monitor;
  }

  /**
   * Reset network ke kondisi normal
   */
  async resetNetwork(): Promise<void> {
    console.log("[NetworkSimulator] Resetting network to normal conditions...");

    // Clear all route handlers
    await this.page.unroute("**/*");

    // Reset network conditions
    const cdp = await this.page.context().newCDPSession(this.page);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });

    console.log("[NetworkSimulator] Network conditions reset");
  }

  /**
   * Complex scenario: Internet drop dan pulih dengan timing
   */
  async simulateInternetDropRecovery(
    dropDuration: number = 5000,
    recoveryDelay: number = 1000,
  ): Promise<void> {
    console.log(
      `[NetworkSimulator] Internet drop scenario: ${dropDuration}ms offline, ${recoveryDelay}ms recovery delay`,
    );

    // Drop connection
    await this.simulateNetworkDisconnect();

    // Wait for drop duration
    await new Promise((resolve) => setTimeout(resolve, dropDuration));

    // Restore connection
    await this.restoreNetworkConnection();

    // Simulate recovery delay (reconnect logic)
    await new Promise((resolve) => setTimeout(resolve, recoveryDelay));

    console.log(
      "[NetworkSimulator] Internet drop recovery simulation complete",
    );
  }
}

/**
 * Network monitoring untuk track request/response patterns
 */
export class NetworkMonitor {
  private page: Page;
  private requests: any[] = [];
  private responses: any[] = [];
  private failures: any[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async start(): Promise<void> {
    this.page.on("request", (request) => {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
        headers: request.headers(),
      });
    });

    this.page.on("response", (response) => {
      this.responses.push({
        url: response.url(),
        status: response.status(),
        timestamp: Date.now(),
        headers: response.headers(),
      });
    });

    this.page.on("requestfailed", (request) => {
      this.failures.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
        failureText: request.failure()?.errorText,
      });
    });
  }

  getStats() {
    return {
      totalRequests: this.requests.length,
      totalResponses: this.responses.length,
      totalFailures: this.failures.length,
      successRate:
        this.requests.length > 0
          ? (this.responses.length / this.requests.length) * 100
          : 0,
      failureRate:
        this.requests.length > 0
          ? (this.failures.length / this.requests.length) * 100
          : 0,
      requests: this.requests,
      responses: this.responses,
      failures: this.failures,
    };
  }

  reset(): void {
    this.requests = [];
    this.responses = [];
    this.failures = [];
  }
}

/**
 * Factory function untuk create NetworkSimulator
 */
export function createNetworkSimulator(page: Page): NetworkSimulator {
  return new NetworkSimulator(page);
}
