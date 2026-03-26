import { EventEmitter } from "events";
import Redis from "ioredis";

export class BaileysEventEmitter extends EventEmitter {
  private redis: Redis | null = null;
  private channel: string;

  constructor(redisUrl?: string, channel: string = "baileys:events") {
    super();
    this.channel = channel;

    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    }
  }

  // Emit event locally dan ke Redis
  async emitEvent(event: string, data: any): Promise<void> {
    // 1. Emit locally untuk internal handlers
    this.emit(event, data);

    // 2. Publish ke Redis untuk Laravel
    if (this.redis) {
      await this.redis.publish(
        this.channel,
        JSON.stringify({
          event,
          data,
          timestamp: Date.now(),
        }),
      );
    }
  }

  // Event methods
  async emitQRGenerated(qr: string): Promise<void> {
    await this.emitEvent("qr:generated", { qr });
  }

  async emitAuthSuccess(jid: string): Promise<void> {
    await this.emitEvent("auth:success", { jid });
  }

  async emitAuthFailure(reason: string): Promise<void> {
    await this.emitEvent("auth:failure", { reason });
  }

  async emitConnectionStatus(
    status: "open" | "close" | "reconnecting",
  ): Promise<void> {
    await this.emitEvent("connection:status", { status });
  }

  async emitMessageReceived(message: any): Promise<void> {
    await this.emitEvent("message:received", message);
  }

  // Pairing code events
  async emitPairingCode(
    code: string,
    phoneNumber: string,
    expiresAt: number,
  ): Promise<void> {
    await this.emitEvent("pairing:code", { code, phoneNumber, expiresAt });
  }

  async emitPairingExpired(phoneNumber: string): Promise<void> {
    await this.emitEvent("pairing:expired", { phoneNumber });
  }

  async emitPairingSuccess(jid: string): Promise<void> {
    await this.emitEvent("pairing:success", { jid });
  }

  async emitPairingError(error: string, phoneNumber?: string): Promise<void> {
    await this.emitEvent("pairing:error", { error, phoneNumber });
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
