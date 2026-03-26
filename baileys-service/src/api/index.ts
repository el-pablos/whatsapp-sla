/**
 * Baileys API Module
 *
 * Entry point untuk semua API components:
 * - Health monitoring endpoints
 * - Broadcast endpoints
 * - Express server setup
 * - Middleware utilities
 */

// API Server
export { ApiServer, createApiServer } from "./server";
export type { ApiServerConfig, ApiServerInfo } from "./server";

// Health Routes
export { createHealthRoutes, healthMiddleware } from "./health";
export type { HealthMetrics, ConnectionHealthStatus } from "./health";

// Broadcast Routes
export { createBroadcastRoutes } from "./broadcast";
export type {
  BroadcastRequest,
  BroadcastResult,
  BroadcastResponse,
} from "./broadcast";
