# WhatsApp Service Contracts

Dokumentasi kontrak payload antar service untuk WhatsApp SLA Bridge.

## Table of Contents

1. [Auth Events Contract](#1-auth-events-contract)
2. [Message Events Contract](#2-message-events-contract)
3. [Connection Events Contract](#3-connection-events-contract)
4. [HTTP API Contract](#4-http-api-contract)
5. [WebSocket Events Contract](#5-websocket-events-contract)
6. [Error Codes](#6-error-codes)

---

## 1. Auth Events Contract

### TypeScript Interfaces

```typescript
// Base event interface
interface BaseEvent {
  event: string;
  timestamp: number;
  sessionId?: string;
}

// QR Code Generated Event
interface QRGeneratedEvent extends BaseEvent {
  event: 'auth.qr.generated';
  data: {
    qr: string;           // QR code string (can be rendered with qrcode library)
    expiresAt: number;    // Unix timestamp when QR expires (usually 60s)
    attempt: number;      // QR generation attempt number
  };
}

// QR Code Scanned Event
interface QRScannedEvent extends BaseEvent {
  event: 'auth.qr.scanned';
  data: {
    timestamp: number;    // When QR was scanned
  };
}

// Pairing Code Requested Event
interface PairingRequestedEvent extends BaseEvent {
  event: 'auth.pairing.requested';
  data: {
    code: string;         // 8-digit pairing code (format: XXXX-XXXX)
    phoneNumber: string;  // Phone number the code was requested for
    expiresAt: number;    // Unix timestamp when code expires
  };
}

// Authentication Success Event
interface AuthSuccessEvent extends BaseEvent {
  event: 'auth.success';
  data: {
    jid: string;          // WhatsApp JID (e.g., "6281234567890@s.whatsapp.net")
    name: string;         // WhatsApp profile name
    phone: string;        // Phone number without @s.whatsapp.net
    platform: string;     // Device platform (e.g., "android", "iphone", "web")
    pushName: string;     // Push notification name
  };
}

// Authentication Failure Event
interface AuthFailureEvent extends BaseEvent {
  event: 'auth.failure';
  data: {
    reason: string;       // Human-readable error message
    code: AuthErrorCode;  // Error code for programmatic handling
    recoverable: boolean; // Whether auth can be retried
  };
}

// Logout Event
interface AuthLogoutEvent extends BaseEvent {
  event: 'auth.logout';
  data: {
    reason: LogoutReason;  // Why logout occurred
    initiatedBy: 'user' | 'server' | 'device'; // Who initiated logout
  };
}

// Auth Error Codes
type AuthErrorCode =
  | 'QR_EXPIRED'           // QR code expired without being scanned
  | 'QR_SCAN_FAILED'       // QR was scanned but auth failed
  | 'PAIRING_EXPIRED'      // Pairing code expired
  | 'PAIRING_INVALID'      // Invalid pairing code entered
  | 'SESSION_EXPIRED'      // Existing session expired
  | 'MULTI_DEVICE_LIMIT'   // Too many linked devices
  | 'BANNED'               // Account is banned
  | 'RATE_LIMITED'         // Too many auth attempts
  | 'UNKNOWN';             // Unknown error

// Logout Reasons
type LogoutReason =
  | 'user_requested'       // User explicitly logged out
  | 'session_replaced'     // Another device took over session
  | 'account_banned'       // WhatsApp banned the account
  | 'connection_lost'      // Lost connection and couldn't recover
  | 'auth_invalidated'     // Auth credentials became invalid
  | 'manual_disconnect';   // Manual disconnect from server
```

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        QR Authentication                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Start] ──► auth.qr.generated ──► auth.qr.scanned             │
│                      │                    │                     │
│                      ▼                    ▼                     │
│              (QR expires)          auth.success                 │
│                      │                    │                     │
│                      ▼                    ▼                     │
│              auth.failure           [Connected]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Pairing Authentication                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Start] ──► auth.pairing.requested ──► (user enters code)     │
│                        │                       │                │
│                        ▼                       ▼                │
│                 (code expires)          auth.success            │
│                        │                       │                │
│                        ▼                       ▼                │
│                 auth.failure             [Connected]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Message Events Contract

### TypeScript Interfaces

```typescript
// Message Content Types
interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image';
  url?: string;          // URL to image (if available)
  base64?: string;       // Base64 encoded image
  mimetype: string;      // e.g., "image/jpeg", "image/png"
  caption?: string;      // Optional caption
  fileSize?: number;     // File size in bytes
  width?: number;        // Image width
  height?: number;       // Image height
}

interface VideoContent {
  type: 'video';
  url?: string;
  base64?: string;
  mimetype: string;      // e.g., "video/mp4"
  caption?: string;
  fileSize?: number;
  duration?: number;     // Duration in seconds
  width?: number;
  height?: number;
  gifPlayback?: boolean; // If video should play as GIF
}

interface AudioContent {
  type: 'audio';
  url?: string;
  base64?: string;
  mimetype: string;      // e.g., "audio/ogg; codecs=opus"
  fileSize?: number;
  duration?: number;     // Duration in seconds
  ptt?: boolean;         // Push-to-talk (voice note)
}

interface DocumentContent {
  type: 'document';
  url?: string;
  base64?: string;
  mimetype: string;
  fileName: string;
  fileSize?: number;
  caption?: string;
}

interface LocationContent {
  type: 'location';
  latitude: number;
  longitude: number;
  name?: string;         // Location name
  address?: string;      // Full address
}

interface ContactContent {
  type: 'contact';
  contacts: Array<{
    name: string;
    phones: string[];
    emails?: string[];
  }>;
}

interface StickerContent {
  type: 'sticker';
  url?: string;
  base64?: string;
  mimetype: string;      // "image/webp"
  isAnimated: boolean;
}

interface ReactionContent {
  type: 'reaction';
  emoji: string;         // Reaction emoji
  targetMessageId: string;
}

interface ButtonResponseContent {
  type: 'button_response';
  selectedButtonId: string;
  selectedButtonText: string;
}

interface ListResponseContent {
  type: 'list_response';
  selectedRowId: string;
  selectedTitle: string;
}

// Union type for all content types
type MessageContent =
  | TextContent
  | ImageContent
  | VideoContent
  | AudioContent
  | DocumentContent
  | LocationContent
  | ContactContent
  | StickerContent
  | ReactionContent
  | ButtonResponseContent
  | ListResponseContent;

// Chat Types
type ChatType = 'private' | 'group' | 'broadcast';

// Incoming Message Event
interface IncomingMessageEvent extends BaseEvent {
  event: 'message.incoming';
  data: {
    messageId: string;       // Unique message ID from WhatsApp
    from: string;            // Sender JID
    fromName: string;        // Sender push name
    to: string;              // Recipient JID (our number)
    chatId: string;          // Chat/conversation ID
    chatType: ChatType;      // Type of chat
    content: MessageContent; // Message content
    quotedMessage?: {        // If replying to another message
      messageId: string;
      content: MessageContent;
      sender: string;
    };
    mentions?: string[];     // Array of mentioned JIDs
    isForwarded: boolean;    // If message was forwarded
    forwardingScore?: number;// How many times forwarded
    isFromMe: boolean;       // If sent by authenticated account
    timestamp: number;       // Unix timestamp
  };
}

// Outgoing Message Event (for sending)
interface OutgoingMessageEvent extends BaseEvent {
  event: 'message.outgoing';
  data: {
    to: string;              // Recipient JID or phone number
    content: MessageContent; // Message content to send
    messageId: string;       // Generated message ID
    quotedMessageId?: string;// Reply to specific message
    mentions?: string[];     // JIDs to mention
  };
}

// Message Status Event
interface MessageStatusEvent extends BaseEvent {
  event: 'message.status';
  data: {
    messageId: string;       // Message ID
    status: MessageStatus;   // Current status
    chatId: string;          // Chat where message belongs
    timestamp: number;       // When status changed
    participant?: string;    // For group: who received/read
  };
}

// Message Status Types
type MessageStatus =
  | 'pending'      // Message queued for sending
  | 'sent'         // Sent to WhatsApp server (single check)
  | 'delivered'    // Delivered to recipient (double check)
  | 'read'         // Read by recipient (blue check)
  | 'played'       // For voice/video: played by recipient
  | 'failed'       // Failed to send
  | 'deleted';     // Message was deleted

// Message Deleted Event
interface MessageDeletedEvent extends BaseEvent {
  event: 'message.deleted';
  data: {
    messageId: string;
    chatId: string;
    deletedBy: string;       // JID of who deleted
    deleteType: 'self' | 'everyone';
  };
}

// Message Edited Event (WhatsApp now supports editing)
interface MessageEditedEvent extends BaseEvent {
  event: 'message.edited';
  data: {
    messageId: string;
    chatId: string;
    oldContent: MessageContent;
    newContent: MessageContent;
    editedAt: number;
  };
}
```

### Message Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Incoming Message Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [WhatsApp Server] ──► message.incoming ──► [Your Application]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Outgoing Message Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Your App] ──► POST /message/send ──► message.outgoing         │
│                        │                      │                 │
│                        ▼                      ▼                 │
│              message.status:pending    [WhatsApp Server]        │
│                        │                      │                 │
│                        ▼                      ▼                 │
│              message.status:sent     message.status:delivered   │
│                                              │                  │
│                                              ▼                  │
│                                     message.status:read         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Connection Events Contract

### TypeScript Interfaces

```typescript
// Connection State
type ConnectionState =
  | 'disconnected'   // Not connected
  | 'connecting'     // Attempting to connect
  | 'connected'      // Connected and ready
  | 'reconnecting';  // Lost connection, attempting to reconnect

// Connection Open Event
interface ConnectionOpenEvent extends BaseEvent {
  event: 'connection.open';
  data: {
    state: 'connected';
    latency?: number;      // Connection latency in ms
  };
}

// Connection Close Event
interface ConnectionCloseEvent extends BaseEvent {
  event: 'connection.close';
  data: {
    reason: ConnectionCloseReason;
    code: number;          // WebSocket close code
    wasClean: boolean;     // If close was clean/expected
  };
}

// Connection Reconnecting Event
interface ConnectionReconnectingEvent extends BaseEvent {
  event: 'connection.reconnecting';
  data: {
    attempt: number;       // Current retry attempt
    maxAttempts: number;   // Maximum retry attempts
    nextRetryIn: number;   // Milliseconds until next retry
    reason: string;        // Why reconnecting
  };
}

// Connection State Changed Event
interface ConnectionStateChangedEvent extends BaseEvent {
  event: 'connection.state_changed';
  data: {
    previousState: ConnectionState;
    currentState: ConnectionState;
    reason?: string;
  };
}

// Close Reasons
type ConnectionCloseReason =
  | 'normal_closure'       // Clean disconnect
  | 'going_away'           // Server shutting down
  | 'protocol_error'       // Protocol violation
  | 'connection_lost'      // Network issue
  | 'auth_failure'         // Authentication failed
  | 'conflict'             // Session conflict (another device)
  | 'restart_required'     // WhatsApp requires restart
  | 'logged_out'           // Account logged out
  | 'banned'               // Account banned
  | 'maintenance';         // WhatsApp maintenance
```

### Connection State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    Connection State Machine                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌──────────────┐                             │
│         ┌─────────►│ disconnected │◄─────────┐                  │
│         │          └──────┬───────┘          │                  │
│         │                 │ connect()        │ max retries      │
│         │                 ▼                  │ exceeded         │
│         │          ┌──────────────┐          │                  │
│    logout/         │  connecting  │──────────┤                  │
│    fatal error     └──────┬───────┘          │                  │
│         │                 │ success          │                  │
│         │                 ▼                  │                  │
│         │          ┌──────────────┐          │                  │
│         └──────────┤  connected   │          │                  │
│                    └──────┬───────┘          │                  │
│                           │ connection lost  │                  │
│                           ▼                  │                  │
│                    ┌──────────────┐          │                  │
│                    │ reconnecting ├──────────┘                  │
│                    └──────┬───────┘                             │
│                           │ success                             │
│                           ▼                                     │
│                    ┌──────────────┐                             │
│                    │  connected   │                             │
│                    └──────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. HTTP API Contract

### Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://wa-bridge.yourdomain.com/api/v1
```

### Authentication

Semua endpoint (kecuali `/health`) memerlukan API key:

```http
Authorization: Bearer <API_KEY>
```

### Standard Response Format

```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    requestId: string;
    timestamp: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  meta?: {
    requestId: string;
    timestamp: number;
  };
}
```

### Endpoints

#### 4.1 Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 3600,
    "connections": {
      "whatsapp": "connected",
      "redis": "connected"
    },
    "memory": {
      "used": 128,
      "total": 512
    }
  }
}
```

#### 4.2 Generate QR Code

```http
POST /auth/qr
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

**Request Body:**
```json
{
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR code generated",
  "data": {
    "qr": "2@ABC123...",
    "expiresAt": 1679900000,
    "sessionId": "session-uuid"
  }
}
```

**Error Codes:**
- `ALREADY_AUTHENTICATED` - Session already authenticated
- `QR_GENERATION_FAILED` - Failed to generate QR

#### 4.3 Generate Pairing Code

```http
POST /auth/pairing
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

**Request Body:**
```json
{
  "phoneNumber": "6281234567890",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pairing code generated",
  "data": {
    "code": "ABCD-EFGH",
    "phoneNumber": "6281234567890",
    "expiresAt": 1679900000,
    "sessionId": "session-uuid"
  }
}
```

**Error Codes:**
- `INVALID_PHONE_NUMBER` - Phone number format invalid
- `ALREADY_AUTHENTICATED` - Session already authenticated
- `PAIRING_GENERATION_FAILED` - Failed to generate pairing code

#### 4.4 Get Auth Status

```http
GET /auth/status
Authorization: Bearer <API_KEY>
```

**Query Parameters:**
- `sessionId` (optional) - Specific session to check

**Response (Not Authenticated):**
```json
{
  "success": true,
  "message": "Auth status retrieved",
  "data": {
    "authenticated": false,
    "state": "disconnected",
    "sessionId": null
  }
}
```

**Response (Authenticated):**
```json
{
  "success": true,
  "message": "Auth status retrieved",
  "data": {
    "authenticated": true,
    "state": "connected",
    "sessionId": "session-uuid",
    "user": {
      "jid": "6281234567890@s.whatsapp.net",
      "name": "John Doe",
      "phone": "6281234567890",
      "platform": "android"
    },
    "connectedAt": 1679850000
  }
}
```

#### 4.5 Logout

```http
POST /auth/logout
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

**Request Body:**
```json
{
  "sessionId": "optional-session-id",
  "clearSession": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "sessionCleared": true
  }
}
```

#### 4.6 Send Message

```http
POST /message/send
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

**Request Body (Text):**
```json
{
  "to": "6281234567890",
  "type": "text",
  "content": {
    "text": "Hello, World!"
  },
  "options": {
    "quotedMessageId": "optional-message-id-to-reply"
  }
}
```

**Request Body (Image):**
```json
{
  "to": "6281234567890",
  "type": "image",
  "content": {
    "url": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }
}
```

**Request Body (Document):**
```json
{
  "to": "6281234567890",
  "type": "document",
  "content": {
    "url": "https://example.com/file.pdf",
    "fileName": "invoice.pdf",
    "caption": "Your invoice"
  }
}
```

**Request Body (Location):**
```json
{
  "to": "6281234567890",
  "type": "location",
  "content": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "name": "Monas",
    "address": "Jakarta, Indonesia"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message queued for sending",
  "data": {
    "messageId": "BAE5ABC123...",
    "status": "pending",
    "to": "6281234567890@s.whatsapp.net",
    "timestamp": 1679900000
  }
}
```

**Error Codes:**
- `NOT_AUTHENTICATED` - Not connected to WhatsApp
- `INVALID_RECIPIENT` - Invalid phone number/JID
- `INVALID_CONTENT` - Message content validation failed
- `RECIPIENT_NOT_ON_WHATSAPP` - Number not registered on WhatsApp
- `MEDIA_TOO_LARGE` - Media file exceeds size limit
- `RATE_LIMITED` - Too many messages sent

#### 4.7 Get Message Status

```http
GET /message/:messageId/status
Authorization: Bearer <API_KEY>
```

**Response:**
```json
{
  "success": true,
  "message": "Message status retrieved",
  "data": {
    "messageId": "BAE5ABC123...",
    "status": "delivered",
    "timestamps": {
      "sent": 1679900000,
      "delivered": 1679900005,
      "read": null
    }
  }
}
```

#### 4.8 Get Chat History

```http
GET /chat/:chatId/messages
Authorization: Bearer <API_KEY>
```

**Query Parameters:**
- `limit` (default: 50, max: 100)
- `before` - Message ID to fetch messages before
- `after` - Message ID to fetch messages after

**Response:**
```json
{
  "success": true,
  "message": "Messages retrieved",
  "data": {
    "chatId": "6281234567890@s.whatsapp.net",
    "messages": [
      {
        "messageId": "BAE5ABC123...",
        "from": "6281234567890@s.whatsapp.net",
        "content": { "type": "text", "text": "Hello!" },
        "timestamp": 1679900000,
        "status": "read"
      }
    ],
    "hasMore": true
  }
}
```

---

## 5. WebSocket Events Contract

### Connection

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://wa-bridge.yourdomain.com/ws');

// Authenticate after connecting
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-api-key'
  }));
};
```

### Event Types

```typescript
// Client -> Server
interface ClientMessage {
  type: 'auth' | 'subscribe' | 'unsubscribe' | 'ping';
  token?: string;      // For auth
  events?: string[];   // For subscribe/unsubscribe
}

// Server -> Client
interface ServerMessage {
  type: 'auth_success' | 'auth_failed' | 'event' | 'pong' | 'error';
  event?: string;      // Event name for type: 'event'
  data?: any;          // Event data
  message?: string;    // For errors
}
```

### Subscribing to Events

```javascript
// Subscribe to specific events
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['message.incoming', 'connection.state_changed', 'auth.*']
}));

// Wildcards supported:
// - 'auth.*' - All auth events
// - 'message.*' - All message events
// - '*' - All events
```

### Event Payload Examples

```javascript
// Incoming message
{
  "type": "event",
  "event": "message.incoming",
  "data": {
    "messageId": "BAE5ABC123...",
    "from": "6281234567890@s.whatsapp.net",
    "fromName": "John",
    "content": {
      "type": "text",
      "text": "Hello!"
    },
    "timestamp": 1679900000
  }
}

// Connection state changed
{
  "type": "event",
  "event": "connection.state_changed",
  "data": {
    "previousState": "connecting",
    "currentState": "connected"
  }
}

// QR generated
{
  "type": "event",
  "event": "auth.qr.generated",
  "data": {
    "qr": "2@ABC123...",
    "expiresAt": 1679900060
  }
}
```

---

## 6. Error Codes

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Action not allowed |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### WhatsApp-Specific Error Codes

| Code | Description |
|------|-------------|
| `NOT_AUTHENTICATED` | Not connected to WhatsApp |
| `ALREADY_AUTHENTICATED` | Already connected |
| `QR_EXPIRED` | QR code expired |
| `QR_GENERATION_FAILED` | Failed to generate QR |
| `PAIRING_EXPIRED` | Pairing code expired |
| `PAIRING_GENERATION_FAILED` | Failed to generate pairing code |
| `INVALID_PHONE_NUMBER` | Invalid phone number format |
| `RECIPIENT_NOT_ON_WHATSAPP` | Number not on WhatsApp |
| `MEDIA_TOO_LARGE` | Media exceeds size limit |
| `MEDIA_DOWNLOAD_FAILED` | Failed to download media |
| `MESSAGE_SEND_FAILED` | Failed to send message |
| `SESSION_NOT_FOUND` | Session does not exist |
| `SESSION_EXPIRED` | Session has expired |
| `CONNECTION_LOST` | Lost connection to WhatsApp |
| `BANNED` | Account is banned |

---

## Appendix A: Phone Number Formats

Sistem menerima berbagai format nomor telepon dan akan menormalisasi secara otomatis:

```
Accepted formats:
- 6281234567890       (recommended)
- +6281234567890      (with country code prefix)
- 081234567890        (local format, will add 62)
- 6281234567890@s.whatsapp.net (full JID)

Normalized to:
- 6281234567890@s.whatsapp.net (for private chat)
- 6281234567890-1234567890@g.us (for group chat)
```

## Appendix B: Media Size Limits

| Type | Max Size | Supported Formats |
|------|----------|-------------------|
| Image | 16 MB | JPEG, PNG, WEBP |
| Video | 64 MB | MP4, 3GP |
| Audio | 16 MB | OGG (opus), MP3, M4A |
| Document | 100 MB | Any |
| Sticker | 500 KB | WEBP |

## Appendix C: Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| `POST /auth/*` | 10 req/min |
| `POST /message/send` | 60 req/min |
| `GET /*` | 120 req/min |
| WebSocket events | 100 msg/sec |

---

*Document Version: 1.0.0*
*Last Updated: 2026-03-26*
