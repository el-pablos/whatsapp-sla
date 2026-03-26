/**
 * Health Check API Routes untuk Baileys Service
 *
 * Menyediakan endpoints untuk monitoring status koneksi WhatsApp
 * dan health metrics untuk observability system.
 */

import { Router, Request, Response } from "express";
import type { ConnectionManager } from "../core/connection-manager";

export interface HealthMetrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  processId: number;
  nodeVersion: string;
  lastActivity: string | null;
  connectionCount: number;
}

export interface ConnectionHealthStatus {
  connected: boolean;
  status: string;
  jid: string | null;
  lastActivity: string | null;
  sessionExists: boolean;
  reconnectCount: number;
  lastError: string | null;
}

/**
 * Create health check routes
 */
export function createHealthRoutes(
  connectionManager: ConnectionManager,
): Router {
  const router = Router();

  /**
   * Basic health check - liveness probe
   * Used by Kubernetes/Docker for basic service health
   */
  router.get("/live", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "baileys",
      timestamp: new Date().toISOString(),
      live: true,
    });
  });

  /**
   * Readiness check - readiness probe
   * Service ready to accept traffic (WhatsApp connected)
   */
  router.get("/ready", async (req: Request, res: Response) => {
    try {
      const isConnected = connectionManager.isConnected();
      const sessionInfo = await connectionManager.getSessionInfo();

      if (isConnected && sessionInfo.metadata?.authenticated) {
        res.status(200).json({
          ready: true,
          service: "baileys",
          status: "connected",
          sessionId: sessionInfo.sessionId,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          ready: false,
          service: "baileys",
          status: connectionManager.status,
          reason: "Not connected to WhatsApp or not authenticated",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(503).json({
        ready: false,
        service: "baileys",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Comprehensive health check with detailed metrics
   */
  router.get("/health", async (req: Request, res: Response) => {
    try {
      const sessionInfo = await connectionManager.getSessionInfo();
      const isConnected = connectionManager.isConnected();

      // Collect health metrics
      const metrics: HealthMetrics = {
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        processId: process.pid,
        nodeVersion: process.version,
        lastActivity: sessionInfo.metadata?.lastActivity || null,
        connectionCount: 1, // Single connection for now
      };

      // Connection health status
      const connectionStatus: ConnectionHealthStatus = {
        connected: isConnected,
        status: connectionManager.status,
        jid: sessionInfo.metadata?.jid || null,
        lastActivity: sessionInfo.metadata?.lastActivity || null,
        sessionExists: sessionInfo.sessionExists,
        reconnectCount: sessionInfo.reconnectStats?.totalAttempts || 0,
        lastError: sessionInfo.reconnectStats?.lastError?.message || null,
      };

      // Determine overall health
      const isHealthy =
        isConnected &&
        sessionInfo.metadata?.authenticated &&
        metrics.memory.heapUsed < 512 * 1024 * 1024; // Less than 512MB

      const responseData = {
        service: "baileys",
        status: isHealthy ? "healthy" : "unhealthy",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptime: metrics.uptime,
        connection: connectionStatus,
        metrics: {
          memory: {
            used: Math.round(metrics.memory.heapUsed / 1024 / 1024), // MB
            total: Math.round(metrics.memory.heapTotal / 1024 / 1024), // MB
            external: Math.round(metrics.memory.external / 1024 / 1024), // MB
            rss: Math.round(metrics.memory.rss / 1024 / 1024), // MB
          },
          process: {
            pid: metrics.processId,
            nodeVersion: metrics.nodeVersion,
            uptime: metrics.uptime,
          },
          session: {
            exists: sessionInfo.sessionExists,
            path: sessionInfo.sessionPath,
            id: sessionInfo.sessionId,
          },
        },
      };

      res.status(isHealthy ? 200 : 503).json(responseData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      res.status(500).json({
        service: "baileys",
        status: "error",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Connection status check - detailed connection info
   */
  router.get("/connection", async (req: Request, res: Response) => {
    try {
      const sessionInfo = await connectionManager.getSessionInfo();
      const socket = connectionManager.getSocket();

      const connectionData = {
        connected: connectionManager.isConnected(),
        status: connectionManager.status,
        jid: sessionInfo.metadata?.jid || null,
        sessionId: sessionInfo.sessionId,
        sessionExists: sessionInfo.sessionExists,
        lastActivity: sessionInfo.metadata?.lastActivity || null,
        reconnectStats: sessionInfo.reconnectStats,
        socketInfo: socket
          ? {
              readyState: socket.readyState,
              user: socket.user || null,
            }
          : null,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(connectionData);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Metrics endpoint for Prometheus scraping
   */
  router.get("/metrics", async (req: Request, res: Response) => {
    try {
      const sessionInfo = await connectionManager.getSessionInfo();
      const isConnected = connectionManager.isConnected();
      const memory = process.memoryUsage();

      // Prometheus metrics format
      const metrics = [
        `# HELP baileys_connection_status Connection status (1 = connected, 0 = disconnected)`,
        `# TYPE baileys_connection_status gauge`,
        `baileys_connection_status{session_id="${sessionInfo.sessionId}"} ${isConnected ? 1 : 0}`,
        ``,
        `# HELP baileys_memory_usage_bytes Memory usage in bytes`,
        `# TYPE baileys_memory_usage_bytes gauge`,
        `baileys_memory_usage_bytes{type="heap_used"} ${memory.heapUsed}`,
        `baileys_memory_usage_bytes{type="heap_total"} ${memory.heapTotal}`,
        `baileys_memory_usage_bytes{type="external"} ${memory.external}`,
        `baileys_memory_usage_bytes{type="rss"} ${memory.rss}`,
        ``,
        `# HELP baileys_uptime_seconds Process uptime in seconds`,
        `# TYPE baileys_uptime_seconds counter`,
        `baileys_uptime_seconds ${Math.floor(process.uptime())}`,
        ``,
        `# HELP baileys_reconnect_total Total reconnection attempts`,
        `# TYPE baileys_reconnect_total counter`,
        `baileys_reconnect_total{session_id="${sessionInfo.sessionId}"} ${sessionInfo.reconnectStats?.totalAttempts || 0}`,
        ``,
      ].join("\n");

      res.type("text/plain").send(metrics);
    } catch (error) {
      res
        .status(500)
        .type("text/plain")
        .send(
          `# Error collecting metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
    }
  });

  return router;
}

/**
 * Health middleware - adds health headers to all responses
 */
export function healthMiddleware(connectionManager: ConnectionManager) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const isConnected = connectionManager.isConnected();

      // Add health headers
      res.setHeader("X-Service-Status", isConnected ? "healthy" : "unhealthy");
      res.setHeader("X-Service-Name", "baileys");
      res.setHeader("X-Service-Version", "1.0.0");
      res.setHeader("X-Uptime", Math.floor(process.uptime()));

      next();
    } catch (error) {
      next();
    }
  };
}
