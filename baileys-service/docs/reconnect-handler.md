# ReconnectHandler Documentation

ReconnectHandler adalah modul untuk menangani strategi reconnect yang robust pada Baileys WhatsApp Web API.

## Features

- **Exponential Backoff with Jitter**: Mencegah thundering herd effect
- **Smart Disconnect Reason Detection**: Membedakan permanent failures vs temporary issues
- **Connection Health Monitoring**: Tracking koneksi unstable
- **Configurable Parameters**: Max attempts, delays, dll

## Installation & Usage

### Basic Usage

```typescript
import { ReconnectHandler } from './handlers/reconnect';
import { makeWASocket, DisconnectReason } from '@whiskeysockets/baileys';

const reconnectHandler = new ReconnectHandler({
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 60000
});

async function createConnection() {
  const sock = makeWASocket({
    // ... your config
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, isNewLogin } = update;

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error
        ? reconnectHandler.shouldReconnect(
            reconnectHandler.parseDisconnectReason(lastDisconnect.error) ||
            DisconnectReason.connectionClosed
          )
        : true;

      if (shouldReconnect) {
        try {
          await reconnectHandler.reconnect(() => createConnection());
        } catch (error) {
          console.error('Failed to reconnect:', error);
          // Handle final failure
        }
      } else {
        console.log('Not reconnecting due to permanent failure');
      }
    } else if (connection === 'open') {
      reconnectHandler.resetOnSuccess();
      console.log('WhatsApp connection established');
    }
  });

  return sock;
}
```

### Advanced Usage with Health Monitoring

```typescript
import { ReconnectHandler } from './handlers/reconnect';

class WhatsAppService {
  private reconnectHandler: ReconnectHandler;
  private sock: WASocket | null = null;

  constructor() {
    this.reconnectHandler = new ReconnectHandler({
      maxAttempts: 15,
      baseDelay: 2000,
      maxDelay: 120000
    });
  }

  async connect() {
    try {
      await this.initSocket();
    } catch (error) {
      console.error('Initial connection failed:', error);
      throw error;
    }
  }

  private async initSocket() {
    this.sock = makeWASocket({
      // ... your config
    });

    this.sock.ev.on('connection.update', async (update) => {
      await this.handleConnectionUpdate(update);
    });

    return this.sock;
  }

  private async handleConnectionUpdate(update: ConnectionState) {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      await this.handleDisconnection(lastDisconnect);
    } else if (connection === 'open') {
      this.handleSuccessfulConnection();
    }
  }

  private async handleDisconnection(lastDisconnect?: DisconnectReason) {
    const disconnectReason = lastDisconnect?.error
      ? ReconnectHandler.parseDisconnectReason(lastDisconnect.error)
      : null;

    // Check connection health before attempting reconnect
    if (!this.reconnectHandler.isConnectionHealthy()) {
      console.warn('Connection unstable, delaying reconnect...');
      await new Promise(r => setTimeout(r, 30000)); // Wait 30s
    }

    const shouldReconnect = disconnectReason
      ? this.reconnectHandler.shouldReconnect(disconnectReason)
      : true;

    if (shouldReconnect) {
      try {
        console.log('Attempting to reconnect...');
        await this.reconnectHandler.reconnect(() => this.initSocket());
      } catch (error) {
        console.error('Reconnection failed completely:', error);
        this.handleFinalFailure();
      }
    } else {
      console.log('Permanent failure detected, not reconnecting');
      this.handlePermanentFailure(disconnectReason);
    }
  }

  private handleSuccessfulConnection() {
    this.reconnectHandler.resetOnSuccess();
    console.log('WhatsApp connected successfully');

    const stats = this.reconnectHandler.getStats();
    if (stats.currentAttempts > 0) {
      console.log(`Reconnected after ${stats.currentAttempts} attempts`);
    }
  }

  private handleFinalFailure() {
    console.error('Max reconnection attempts reached. Service stopped.');
    // Notify monitoring system
    // Maybe restart service completely
  }

  private handlePermanentFailure(reason: DisconnectReason | null) {
    console.error('Permanent failure:', reason);
    // Handle logout, session invalid, etc.
    // Maybe clear session and request new QR
  }

  getConnectionStats() {
    return this.reconnectHandler.getStats();
  }
}
```

## Configuration Options

```typescript
interface ReconnectOptions {
  maxAttempts?: number;  // Default: 10
  baseDelay?: number;    // Default: 1000ms
  maxDelay?: number;     // Default: 60000ms
}
```

## Disconnect Reasons Handling

### Akan Reconnect (Temporary Issues)
- `DisconnectReason.connectionClosed`
- `DisconnectReason.connectionLost`
- `DisconnectReason.timedOut`
- `DisconnectReason.restartRequired`
- `DisconnectReason.connectionReplaced`

### Tidak Akan Reconnect (Permanent Failures)
- `DisconnectReason.loggedOut`
- `DisconnectReason.badSession`
- `DisconnectReason.forbidden`
- `DisconnectReason.unavailableService`

## Methods

### `shouldReconnect(reason: DisconnectReason): boolean`
Menentukan apakah harus reconnect berdasarkan alasan disconnect.

### `calculateDelay(): number`
Menghitung delay untuk reconnect dengan exponential backoff + jitter.

### `reconnect(initSocket: () => Promise<void>): Promise<void>`
Melakukan reconnect dengan delay yang sudah dihitung.

### `resetOnSuccess(): void`
Reset counter setelah koneksi berhasil.

### `getStats()`
Mendapatkan statistik reconnection.

### `isConnectionHealthy(): boolean`
Mengecek apakah koneksi healthy (tidak terlalu sering disconnect).

### `reset(): void`
Reset semua state (untuk testing atau manual reset).

### `static parseDisconnectReason(error: any): DisconnectReason | null`
Parse error object untuk mendapatkan DisconnectReason.

## Best Practices

1. **Selalu cek `isConnectionHealthy()`** sebelum reconnect jika koneksi sering bermasalah
2. **Handle permanent failures** dengan logic yang berbeda (misalnya clear session)
3. **Monitor stats** untuk analisis performa koneksi
4. **Set timeout** yang sesuai untuk environment produksi
5. **Log semua events** untuk debugging

## Testing

```bash
# Run unit tests
npm test handlers/reconnect.test.ts

# Run dengan coverage
npm run test:coverage
```

Tests mencakup:
- Disconnect reason detection
- Exponential backoff calculation
- Reconnect flow
- Error handling
- Health monitoring
- Integration scenarios