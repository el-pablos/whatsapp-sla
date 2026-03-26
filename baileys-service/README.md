# Baileys Service

Socket Initializer untuk WhatsApp Baileys library.

## Features

- ✅ **Socket Initialization** - Initialize Baileys socket dengan configuration yang proper
- ✅ **Auth State Management** - Load/save authentication state dengan useMultiFileAuthState
- ✅ **Version Detection** - Auto-fetch latest Baileys version
- ✅ **Event Handling** - Comprehensive event handlers untuk connection, messages, dll
- ✅ **Redis Integration** - Emit events ke Redis untuk Laravel consumption
- ✅ **Disconnect Handling** - Smart disconnect handling dengan reconnection logic
- ✅ **QR & Pairing Code** - Support untuk both QR code dan pairing code authentication
- ✅ **TypeScript** - Full TypeScript support dengan proper type definitions

## Installation

```bash
cd baileys-service
npm install
```

## Configuration

```typescript
import { initializeSocket, BaileysEventEmitter } from "@whatsapp-sla/baileys-service";

const config = {
  sessionPath: "./wa-sessions",
  browser: ["My App", "Chrome", "1.0.0"],
  printQRInTerminal: false
};

const eventEmitter = new BaileysEventEmitter("redis://localhost:6379");
```

## Usage

### Basic Socket Initialization

```typescript
import { initializeSocket } from "./socket";

const { socket, saveCreds } = await initializeSocket({
  sessionPath: "./sessions/wa",
  browser: ["WhatsApp SLA", "Chrome", "1.0.0"]
});

// Socket siap digunakan
console.log("Socket ready:", socket.user?.id);
```

### With Event Emitter (untuk Laravel integration)

```typescript
import { BaileysEventEmitter } from "./handlers/events";

const eventEmitter = new BaileysEventEmitter("redis://localhost:6379", "baileys:events");

const { socket } = await initializeSocket(config, eventEmitter);

// Events akan dikirim ke Redis channel "baileys:events"
```

### Pairing Code Authentication

```typescript
import { requestPairingCode } from "./socket";

const code = await requestPairingCode(socket, "6281234567890");
console.log("Pairing code:", code); // "ABCD1234"
```

## Events

Event emitter mengirim events berikut ke Redis:

- `qr:generated` - QR code untuk scanning
- `auth:success` - Authentication berhasil
- `auth:failure` - Authentication gagal
- `connection:status` - Status koneksi (open/close/reconnecting)
- `connection:disconnect` - Detail disconnect dengan action yang direkomendasikan
- `message:received` - Message baru diterima

## Testing

```bash
npm test
npm run test:watch
```

## Demo

```bash
npm run dev
# atau
npx ts-node src/demo.ts
```

## Build

```bash
npm run build
```

## Files Structure

```
src/
  socket.ts           # Main socket initializer
  types.ts           # TypeScript type definitions
  index.ts           # Entry point
  demo.ts            # Demo script
  handlers/
    events.ts        # Event emitter dengan Redis integration
    disconnect.ts    # Disconnect handling logic
tests/
  socket.test.ts     # Unit tests
```

## Error Handling

Socket initializer handle berbagai error scenarios:

- **Invalid session path** - Validasi path dan security
- **Authentication failures** - Clear session pada logout
- **Connection issues** - Smart reconnection dengan backoff
- **Version mismatches** - Fallback ke version yang stable

## Laravel Integration

Event yang dikirim ke Redis bisa diterima Laravel dengan:

```php
// Laravel subscriber
Redis::subscribe(['baileys:events'], function ($message) {
    $data = json_decode($message, true);

    match($data['event']) {
        'qr:generated' => handleQRCode($data['data']['qr']),
        'auth:success' => handleAuthSuccess($data['data']['jid']),
        'message:received' => handleMessage($data['data']),
        default => logger()->info('Unknown event', $data)
    };
});
```