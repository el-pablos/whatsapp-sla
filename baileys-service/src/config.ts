import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface BaileysConfig {
  sessionPath: string;
  apiPort: number;
  webhookUrl: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  browserName: string;
  browserVersion: string;
  reconnectMaxRetries: number;
  reconnectBaseDelay: number;
  qrTimeout: number;
  pairingCodeTimeout: number;
}

export interface LaravelConfig {
  apiUrl: string;
  apiKey: string;
}

export interface Config {
  baileys: BaileysConfig;
  laravel: LaravelConfig;
  nodeEnv: string;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value !== undefined && value !== "" ? value : defaultValue;
}

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value === "") {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(
      `Environment variable ${key} must be a number, got: ${value}`,
    );
  }
  return parsed;
}

export function loadConfig(): Config {
  const nodeEnv = getEnvOrDefault("NODE_ENV", "development");

  return {
    nodeEnv,
    baileys: {
      sessionPath: getEnvOrDefault(
        "BAILEYS_SESSION_PATH",
        path.resolve(__dirname, "../sessions"),
      ),
      apiPort: getEnvAsNumber("BAILEYS_API_PORT", 3002),
      webhookUrl: getEnvOrDefault(
        "BAILEYS_WEBHOOK_URL",
        "http://127.0.0.1:8000/api/whatsapp/webhook",
      ),
      logLevel: getEnvOrDefault(
        "BAILEYS_LOG_LEVEL",
        nodeEnv === "production" ? "warn" : "info",
      ) as BaileysConfig["logLevel"],
      browserName: getEnvOrDefault("BAILEYS_BROWSER_NAME", "WhatsApp SLA Bot"),
      browserVersion: getEnvOrDefault("BAILEYS_BROWSER_VERSION", "1.0.0"),
      reconnectMaxRetries: getEnvAsNumber("BAILEYS_RECONNECT_MAX_RETRIES", 5),
      reconnectBaseDelay: getEnvAsNumber("BAILEYS_RECONNECT_BASE_DELAY", 10000),
      qrTimeout: getEnvAsNumber("BAILEYS_QR_TIMEOUT", 60000),
      pairingCodeTimeout: getEnvAsNumber("BAILEYS_PAIRING_TIMEOUT", 120000),
    },
    laravel: {
      apiUrl: getEnvOrDefault("LARAVEL_API_URL", "http://127.0.0.1:8000/api"),
      apiKey: getEnvOrDefault("LARAVEL_API_KEY", ""),
    },
  };
}

export const config = loadConfig();
export default config;
