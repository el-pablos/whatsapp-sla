/**
 * Baileys API Server
 *
 * Express server untuk menyediakan REST API endpoints
 * untuk monitoring dan management WhatsApp connection.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { ConnectionManager } from "../core/connection-manager";
import { createHealthRoutes, healthMiddleware } from "./health";
import { loadConfig } from "../config";

export interface ApiServerConfig {
  port: number;
  host?: string;
  enableCors?: boolean;
  enableLogging?: boolean;
  enableSecurity?: boolean;
}

export interface ApiServerInfo {
  port: number;
  host: string;
  baseUrl: string;
  status: "starting" | "running" | "stopping" | "stopped";
}

/**
 * API Server class untuk Baileys service
 */
export class ApiServer {
  private app: express.Application;
  private server: any = null;
  private config: ApiServerConfig;
  private connectionManager: ConnectionManager;
  private _status: ApiServerInfo["status"] = "stopped";

  constructor(
    connectionManager: ConnectionManager,
    config?: Partial<ApiServerConfig>,
  ) {
    this.connectionManager = connectionManager;
    this.config = {
      port: 3001,
      host: "0.0.0.0",
      enableCors: true,
      enableLogging: true,
      enableSecurity: true,
      ...config,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    if (this.config.enableSecurity) {
      this.app.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
            },
          },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
        }),
      );
    }

    // CORS middleware
    if (this.config.enableCors) {
      this.app.use(
        cors({
          origin:
            process.env.NODE_ENV === "production"
              ? ["https://localhost", "https://127.0.0.1"]
              : true,
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE"],
          allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        }),
      );
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging middleware
    if (this.config.enableLogging) {
      const format = process.env.NODE_ENV === "production" ? "combined" : "dev";
      this.app.use(morgan(format));
    }

    // Health middleware - adds service headers
    this.app.use(healthMiddleware(this.connectionManager));

    // Request tracking
    this.app.use((req, res, next) => {
      req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader("X-Request-ID", req.requestId);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Service info endpoint
    this.app.get("/", (req, res) => {
      res.json({
        service: "baileys-api",
        version: "1.0.0",
        status: this._status,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: "/health",
          live: "/health/live",
          ready: "/health/ready",
          connection: "/health/connection",
          metrics: "/health/metrics",
        },
      });
    });

    // Mount health routes
    this.app.use("/health", createHealthRoutes(this.connectionManager));

    // API info endpoint
    this.app.get("/info", async (req, res) => {
      try {
        const sessionInfo = await this.connectionManager.getSessionInfo();
        const config = loadConfig();

        res.json({
          server: {
            status: this._status,
            port: this.config.port,
            host: this.config.host,
            uptime: Math.floor(process.uptime()),
            nodeVersion: process.version,
            pid: process.pid,
          },
          baileys: {
            sessionId: sessionInfo.sessionId,
            status: this.connectionManager.status,
            connected: this.connectionManager.isConnected(),
            sessionExists: sessionInfo.sessionExists,
          },
          config: {
            environment: process.env.NODE_ENV || "development",
            logLevel: config.logging.level,
            retryPolicy: config.retry,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        error: "Endpoint not found",
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    // General error handler
    this.app.use(
      (
        error: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        console.error("API Error:", error);

        res.status(500).json({
          error: "Internal server error",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Something went wrong",
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        });
      },
    );

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      this.stop().finally(() => {
        process.exit(1);
      });
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  }

  /**
   * Start API server
   */
  async start(): Promise<ApiServerInfo> {
    if (this._status === "running") {
      throw new Error("Server is already running");
    }

    this._status = "starting";

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(
          this.config.port,
          this.config.host,
          () => {
            this._status = "running";

            const serverInfo: ApiServerInfo = {
              port: this.config.port!,
              host: this.config.host!,
              baseUrl: `http://${this.config.host}:${this.config.port}`,
              status: this._status,
            };

            console.log(
              `🚀 Baileys API Server running at ${serverInfo.baseUrl}`,
            );
            resolve(serverInfo);
          },
        );

        this.server.on("error", (error: Error) => {
          this._status = "stopped";
          reject(error);
        });
      } catch (error) {
        this._status = "stopped";
        reject(error);
      }
    });
  }

  /**
   * Stop API server
   */
  async stop(): Promise<void> {
    if (this._status !== "running") {
      return;
    }

    this._status = "stopping";

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this._status = "stopped";
          console.log("📦 Baileys API Server stopped");
          resolve();
        });
      } else {
        this._status = "stopped";
        resolve();
      }
    });
  }

  /**
   * Get server info
   */
  getInfo(): ApiServerInfo {
    return {
      port: this.config.port!,
      host: this.config.host!,
      baseUrl: `http://${this.config.host}:${this.config.port}`,
      status: this._status,
    };
  }

  /**
   * Get Express app (for testing)
   */
  getApp(): express.Application {
    return this.app;
  }
}

/**
 * Factory function untuk create API server
 */
export function createApiServer(
  connectionManager: ConnectionManager,
  config?: Partial<ApiServerConfig>,
): ApiServer {
  return new ApiServer(connectionManager, config);
}

// Type augmentation untuk Express Request
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
