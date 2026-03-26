# QRHandler - WhatsApp Authentication QR Code Management

QRHandler adalah modul untuk mengelola QR code authentication dari Baileys WhatsApp library. Handler ini mengelola lifecycle QR code, timeout, dan event yang bisa di-consume oleh Laravel backend.

## Features

- ✅ Generate QR sebagai base64 PNG image
- ✅ Generate QR untuk terminal display
- ✅ Timeout handling (30 detik default)
- ✅ Max retries protection (5 attempts default)
- ✅ Event emission untuk Laravel integration
- ✅ Edge case handling (expired QR, multiple requests)
- ✅ TypeScript interfaces yang lengkap
- ✅ Comprehensive unit tests

## Usage

### Basic Usage

```typescript
import { QRHandler } from './auth/qr-handler';
import { BaileysEventEmitter } from './handlers/events';

// Initialize dengan konfigurasi default
const qrHandler = new QRHandler();
const eventEmitter = new BaileysEventEmitter();

// Event listeners
qrHandler.on('qr:generated', async (qrData) => {
  console.log('New QR generated:', {
    attempt: qrData.attempt,
    expiresAt: new Date(qrData.expiresAt),
  });

  // Send ke Laravel via event emitter
  await eventEmitter.emitQRGenerated(qrData.base64!);
});

qrHandler.on('qr:expired', (attempt) => {
  console.log(`QR expired on attempt ${attempt}`);
});

// Handle QR dari Baileys
connection.ev.on('connection.update', async (update) => {
  if (update.qr) {
    try {
      const qrData = await qrHandler.handleQRUpdate(update.qr);
      console.log('QR ready for scanning');
    } catch (error) {
      console.error('QR handling failed:', error.message);
    }
  }

  if (update.connection === 'open') {
    qrHandler.setAuthenticated(true);
  }
});
```

### Custom Configuration

```typescript
const qrHandler = new QRHandler({
  timeout: 45000,        // 45 detik timeout
  maxRetries: 3,         // Max 3 attempts
  logger: (level, msg) => {
    // Custom logger implementation
    logger.log(level, `[QR] ${msg}`);
  }
});
```

### API Integration Example

```typescript
// Express route untuk mendapatkan QR
app.get('/api/whatsapp/qr', async (req, res) => {
  try {
    const base64QR = await qrHandler.getQRAsBase64();

    if (!base64QR) {
      return res.status(404).json({
        error: 'No QR available',
        retry_after: 5000
      });
    }

    const qrData = qrHandler.getQRData();

    res.json({
      qr: base64QR,
      expires_at: qrData?.expiresAt,
      remaining_ms: qrHandler.getRemainingTime(),
      attempt: qrData?.attempt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket untuk real-time QR updates
io.on('connection', (socket) => {
  qrHandler.on('qr:generated', (qrData) => {
    socket.emit('qr:new', {
      qr: qrData.base64,
      expires_at: qrData.expiresAt,
      attempt: qrData.attempt,
    });
  });

  qrHandler.on('qr:expired', (attempt) => {
    socket.emit('qr:expired', { attempt });
  });

  qrHandler.on('qr:cleared', () => {
    socket.emit('auth:success');
  });
});
```

### Laravel Integration via Redis

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

qrHandler.on('qr:generated', async (qrData) => {
  // Publish ke Redis channel untuk Laravel
  await redis.publish('whatsapp:qr', JSON.stringify({
    event: 'qr:generated',
    data: {
      qr: qrData.base64,
      expires_at: qrData.expiresAt,
      attempt: qrData.attempt,
    },
    timestamp: Date.now(),
  }));
});

qrHandler.on('qr:cleared', async () => {
  await redis.publish('whatsapp:qr', JSON.stringify({
    event: 'auth:success',
    timestamp: Date.now(),
  }));
});
```

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `qr:generated` | `QRData` | QR code baru di-generate |
| `qr:expired` | `attempt: number` | QR code expired |
| `qr:max-retries` | none | Max retry attempts tercapai |
| `qr:cleared` | none | QR cleared setelah auth success |

## Methods

### `handleQRUpdate(qr: string): Promise<QRData>`
Handle QR update dari Baileys connection.

### `getQRAsBase64(): Promise<string | null>`
Get current QR sebagai base64 PNG image.

### `getQRAsTerminal(): Promise<string | null>`
Get current QR untuk terminal display.

### `getQRData(): QRData | null`
Get full QR data object.

### `isQRValid(): boolean`
Cek apakah QR masih valid (belum expired).

### `getRemainingTime(): number`
Get remaining time sebelum QR expired (ms).

### `clearQR(): void`
Clear QR setelah authentication berhasil.

### `reset(): void`
Reset handler untuk session baru.

### `setAuthenticated(authenticated: boolean): void`
Set authentication status.

## Interfaces

```typescript
interface QRData {
  raw: string;           // Raw QR string dari Baileys
  base64?: string;       // Base64 PNG image
  terminal?: string;     // Terminal string representation
  generatedAt: number;   // Generation timestamp
  expiresAt: number;     // Expiration timestamp
  attempt: number;       // Current attempt number
}

interface QROptions {
  timeout?: number;      // Timeout dalam ms (default: 30000)
  maxRetries?: number;   // Max attempts (default: 5)
  logger?: (level: string, message: string) => void;
}
```

## Error Handling

- **Max Retries Exceeded**: Throws setelah max attempts tercapai
- **Already Authenticated**: Rejects QR baru jika sudah authenticated
- **QR Generation Failed**: Propagates QRCode library errors

## Testing

```bash
# Run unit tests
npm test qr-handler.test.ts

# Run dengan coverage
npm run test:coverage -- qr-handler.test.ts
```

## Production Considerations

1. **Memory Usage**: QR data di-cache dalam memory, monitor usage
2. **Event Cleanup**: Pastikan event listeners di-cleanup dengan `destroy()`
3. **Redis Connection**: Handle Redis connection failures gracefully
4. **Rate Limiting**: Implement rate limiting untuk QR API endpoints
5. **Logging**: Enable structured logging untuk production debugging

## See Also

- [BaileysEventEmitter](../handlers/events.ts) - Event emission ke Redis/Laravel
- [DisconnectHandler](../handlers/disconnect.ts) - Connection handling
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)