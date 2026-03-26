# Baileys WhatsApp Event Lifecycle Documentation

**FASE 3 - Agent 4/6: Event Lifecycle Designer**
**Version:** 1.0.0
**Last Updated:** 2026-03-26

---

## Table of Contents

1. [Overview](#overview)
2. [State Machine Master Diagram](#state-machine-master-diagram)
3. [Startup Lifecycle](#1-startup-lifecycle)
4. [Auth Lifecycle - QR Mode](#2-auth-lifecycle---qr-mode)
5. [Auth Lifecycle - Pairing Code Mode](#3-auth-lifecycle---pairing-code-mode)
6. [Reconnect Lifecycle](#4-reconnect-lifecycle)
7. [Shutdown Lifecycle](#5-shutdown-lifecycle)
8. [Event Reference Table](#event-reference-table)
9. [Error Codes & Recovery](#error-codes--recovery)
10. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

Dokumen ini mendefinisikan lifecycle lengkap untuk event handling dalam integrasi Baileys WhatsApp. Setiap lifecycle mencakup:

- **Trigger Condition**: Kondisi yang memicu event
- **Handler Action**: Aksi yang harus dilakukan
- **Next State**: State selanjutnya setelah handler selesai
- **Error Handling**: Cara menangani error
- **Logging Requirement**: Informasi yang harus di-log

### State Definitions

| State | Description | Persistent |
|-------|-------------|------------|
| `IDLE` | Service tidak aktif, menunggu start | No |
| `INITIALIZING` | Mempersiapkan service | No |
| `SESSION_LOADING` | Memuat session dari storage | No |
| `AWAITING_QR` | Menunggu QR di-scan | No |
| `AWAITING_PAIRING` | Menunggu pairing code dikonfirmasi | No |
| `AUTHENTICATING` | Proses autentikasi sedang berjalan | No |
| `CONNECTED` | Terhubung dan siap operasi | Yes |
| `RECONNECTING` | Mencoba reconnect setelah disconnect | No |
| `DISCONNECTING` | Proses shutdown graceful | No |
| `ERROR` | Terjadi error, butuh intervention | No |
| `LOGGED_OUT` | Session logout, perlu re-auth | Yes |

---

## State Machine Master Diagram

```
                                    ┌─────────────────────────────────────────────────────────────────┐
                                    │                    MASTER STATE MACHINE                          │
                                    └─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │   IDLE   │
    └────┬─────┘
         │ [service.start()]
         ▼
    ┌──────────────┐
    │ INITIALIZING │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐    session exists?     ┌─────────────────┐
    │ SESSION_LOADING  │───────── YES ─────────▶│  AUTHENTICATING │
    └────────┬─────────┘                        └────────┬────────┘
             │                                           │
             │ NO session                                │ auth success
             ▼                                           │
    ┌─────────────────────────────┐                      │
    │ AUTH_METHOD_SELECTION       │                      │
    │ ┌─────────┐   ┌───────────┐ │                      │
    │ │ QR Mode │   │ Pairing   │ │                      │
    │ └────┬────┘   └─────┬─────┘ │                      │
    └──────┼──────────────┼───────┘                      │
           │              │                              │
           ▼              ▼                              │
    ┌─────────────┐ ┌───────────────┐                    │
    │ AWAITING_QR │ │AWAITING_PAIRING│                   │
    └──────┬──────┘ └───────┬───────┘                    │
           │                │                            │
           │ scanned        │ confirmed                  │
           │                │                            │
           └────────┬───────┘                            │
                    │                                    │
                    ▼                                    │
           ┌─────────────────┐                           │
           │  AUTHENTICATING │◀──────────────────────────┘
           └────────┬────────┘
                    │
                    │ success
                    ▼
           ┌─────────────────┐
           │   CONNECTED     │◀─────────────────────────┐
           └────────┬────────┘                          │
                    │                                   │
        ┌───────────┼───────────┐                       │
        │           │           │                       │
        ▼           ▼           ▼                       │
   disconnect   error       shutdown                    │
        │           │           │                       │
        ▼           ▼           ▼                       │ reconnect
   ┌──────────┐ ┌───────┐ ┌─────────────┐               │ success
   │RECONNECT │ │ ERROR │ │DISCONNECTING│               │
   │   ING    │ └───┬───┘ └──────┬──────┘               │
   └────┬─────┘     │            │                      │
        │           │            ▼                      │
        │           │     ┌──────────┐                  │
        │           │     │   IDLE   │                  │
        │           │     └──────────┘                  │
        │           │                                   │
        │           └─────────────┬─────────────────────┤
        │                         │                     │
        │ retry                   ▼                     │
        │                  ┌────────────┐               │
        │                  │ LOGGED_OUT │ (requires     │
        │                  └────────────┘  re-auth)     │
        │                                               │
        └───────────────────────────────────────────────┘
```

---

## 1. Startup Lifecycle

### 1.1 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STARTUP LIFECYCLE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

     START
        │
        ▼
┌───────────────────┐
│   E1: SERVICE_    │   Trigger: Application boot / Manual start
│      START        │   Action:  Initialize service dependencies
│                   │   Log:     "WhatsApp service starting..."
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  E2: CONFIG_      │   Trigger: After service init
│     LOADED        │   Action:  Load & validate configuration
│                   │   Log:     "Config loaded: authDir={path}"
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  E3: SESSION_     │   Trigger: After config validation
│     CHECK         │   Action:  Check if session exists in authDir
│                   │   Log:     "Checking session at {authDir}"
└─────────┬─────────┘
          │
          ├─── Session Exists ────────────┐
          │                               │
          ▼                               ▼
┌───────────────────┐         ┌───────────────────┐
│  E4A: SESSION_    │         │  E4B: SESSION_    │
│      FOUND        │         │      NOT_FOUND    │
│                   │         │                   │
│ Action: Load creds│         │ Action: Prepare   │
│ Log: "Session     │         │         auth flow │
│       found"      │         │ Log: "No session" │
└─────────┬─────────┘         └─────────┬─────────┘
          │                             │
          ▼                             │
┌───────────────────┐                   │
│  E5: SOCKET_      │                   │
│     CREATING      │◀──────────────────┘
│                   │
│ Trigger: After    │
│   session check   │
│ Action: Create    │
│   Baileys socket  │
│ Log: "Creating    │
│   WebSocket..."   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  E6: SOCKET_      │   Trigger: makeWASocket() success
│     CREATED       │   Action:  Attach event handlers
│                   │   Log:     "Socket created, attaching handlers"
└─────────┬─────────┘
          │
          ├─── Has Valid Session ──────┐
          │                            │
          ▼                            ▼
    [AUTH FLOW]              ┌───────────────────┐
                             │  E7: AUTO_        │
                             │     CONNECTING    │
                             │                   │
                             │ Action: Connect   │
                             │         to WA     │
                             │ Log: "Auto-conn   │
                             │       with creds" │
                             └─────────┬─────────┘
                                       │
                                       ▼
                             ┌───────────────────┐
                             │  E8: CONNECTION_  │
                             │     ESTABLISHED   │
                             │                   │
                             │ Action: Emit      │
                             │         CONNECTED │
                             │ Log: "Connected   │
                             │       as {jid}"   │
                             └───────────────────┘
```

### 1.2 Event Details

#### E1: SERVICE_START

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Application boot, manual `start()` call, atau PM2 restart |
| **Handler Action** | 1. Initialize logger<br>2. Validate environment<br>3. Load service dependencies<br>4. Create auth directory if not exists |
| **Next State** | `INITIALIZING` |
| **Error Handling** | - Log error dengan stack trace<br>- Emit `SERVICE_START_FAILED` event<br>- Exit dengan error code 1 |
| **Logging** | `level: info`<br>`message: "WhatsApp service starting"`<br>`context: { version, nodeEnv, pid }` |

```typescript
// Event Payload
interface ServiceStartEvent {
  timestamp: number;
  version: string;
  environment: 'development' | 'staging' | 'production';
  config: {
    authDir: string;
    qrTimeoutMs: number;
    reconnectAttempts: number;
  };
}
```

#### E2: CONFIG_LOADED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | SERVICE_START completed successfully |
| **Handler Action** | 1. Load config dari environment/file<br>2. Validate required fields<br>3. Apply defaults untuk optional fields<br>4. Resolve paths (authDir) |
| **Next State** | `SESSION_LOADING` |
| **Error Handling** | - `CONFIG_INVALID`: Log missing/invalid fields, emit error<br>- `PATH_NOT_WRITABLE`: Check permissions, suggest fix |
| **Logging** | `level: info`<br>`message: "Configuration loaded"`<br>`context: { authDir, browserName, qrTimeoutMs }` |

```typescript
// Event Payload
interface ConfigLoadedEvent {
  timestamp: number;
  config: BaileysConfig;
  validationResult: {
    valid: boolean;
    warnings: string[];
  };
}
```

#### E3: SESSION_CHECK

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | CONFIG_LOADED completed |
| **Handler Action** | 1. Check if `creds.json` exists<br>2. Validate JSON structure if exists<br>3. Check for backup if main corrupted<br>4. Determine auth flow needed |
| **Next State** | `SESSION_LOADING` atau trigger auth flow |
| **Error Handling** | - `CREDS_CORRUPTED`: Attempt restore from backup<br>- `BACKUP_FAILED`: Delete corrupted, start fresh auth |
| **Logging** | `level: debug`<br>`message: "Session check completed"`<br>`context: { exists, valid, hasBackup }` |

```typescript
// Event Payload
interface SessionCheckEvent {
  timestamp: number;
  authDir: string;
  sessionFound: boolean;
  sessionValid: boolean;
  backupAvailable: boolean;
  restoredFromBackup: boolean;
}
```

#### E4A: SESSION_FOUND / E4B: SESSION_NOT_FOUND

| Attribute | E4A: SESSION_FOUND | E4B: SESSION_NOT_FOUND |
|-----------|-------------------|----------------------|
| **Trigger** | Valid session file exists | No session atau invalid |
| **Action** | Load credentials ke memory | Prepare untuk auth flow |
| **Next State** | `AUTHENTICATING` | `AWAITING_QR` atau `AWAITING_PAIRING` |
| **Logging** | `"Existing session loaded"` | `"No valid session, auth required"` |

#### E5: SOCKET_CREATING

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Session check completed |
| **Handler Action** | 1. Call `makeWASocket()` dengan config<br>2. Setup auth state<br>3. Configure logger<br>4. Set browser identifier |
| **Next State** | Creating... |
| **Error Handling** | - `SOCKET_CREATE_FAILED`: Log error, retry dengan backoff<br>- `VERSION_MISMATCH`: Fetch latest version, retry |
| **Logging** | `level: debug`<br>`message: "Creating WebSocket connection"`<br>`context: { version, browser, printQR }` |

```typescript
// Socket Creation Config
const socketConfig: WASocketConfig = {
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger),
  },
  version: await fetchLatestBaileysVersion(),
  logger: pinoLogger,
  printQRInTerminal: false,
  browser: ['whatsapp-sla', 'server', '1.0.0'],
  syncFullHistory: false,
  markOnlineOnConnect: false,
};
```

#### E6: SOCKET_CREATED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | `makeWASocket()` returns successfully |
| **Handler Action** | 1. Attach `connection.update` handler<br>2. Attach `creds.update` handler<br>3. Attach `messages.upsert` handler<br>4. Setup error handlers |
| **Next State** | Depends on session state |
| **Error Handling** | N/A - Socket created successfully |
| **Logging** | `level: info`<br>`message: "Socket created, handlers attached"`<br>`context: { handlerCount }` |

---

## 2. Auth Lifecycle - QR Mode

### 2.1 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          QR AUTH LIFECYCLE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

      SOCKET_CREATED
      (no session)
           │
           ▼
┌───────────────────┐
│  Q1: QR_MODE_     │   Trigger: No valid session + QR mode selected
│     INITIATED     │   Action:  Set state to AWAITING_QR
│                   │   Log:     "Starting QR authentication flow"
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Q2: QR_CODE_     │   Trigger: connection.update contains qr
│     GENERATED     │   Action:  1. Convert to base64 image
│                   │            2. Emit QR via event/callback
│                   │            3. Start timeout timer
│                   │   Log:     "QR code generated, waiting for scan"
└─────────┬─────────┘
          │
          ├─────────────── timeout ───────────────┐
          │                                       │
          ▼                                       ▼
┌───────────────────┐               ┌───────────────────┐
│  Q3: QR_CODE_     │               │  Q6: QR_TIMEOUT   │
│     DISPLAYED     │               │                   │
│                   │               │ Action: 1. Clear  │
│ Action: Show QR   │               │          timer    │
│   in terminal or  │               │         2. Close  │
│   send to client  │               │          socket   │
│                   │               │         3. Emit   │
│ Log: "QR display  │               │          timeout  │
│       ed to user" │               │ Log: "QR timeout" │
└─────────┬─────────┘               └─────────┬─────────┘
          │                                   │
          │ user scans                        │
          ▼                                   │
┌───────────────────┐                         │
│  Q4: QR_SCANNED   │                         │
│                   │                         │
│ Trigger: WA app   │                         │
│   confirms scan   │                         │
│ Action: Clear     │                         │
│   timeout timer   │                         │
│ Log: "QR scanned" │                         │
└─────────┬─────────┘                         │
          │                                   │
          ▼                                   │
┌───────────────────┐                         │
│  Q5: AUTH_        │                         │
│     SUCCESS       │                         │
│                   │                         │
│ Action: 1. Save   │                         │
│          creds    │                         │
│         2. Emit   │                         │
│          success  │                         │
│         3. Trans  │                         │
│          CONNECTED│                         │
│ Log: "Auth OK"    │                         │
└─────────┬─────────┘                         │
          │                                   │
          ▼                                   │
    ┌───────────┐                             │
    │ CONNECTED │◀────── retry? ──────────────┤
    └───────────┘                             │
                                              ▼
                                    ┌───────────────────┐
                                    │  Q7: QR_EXPIRED   │
                                    │                   │
                                    │ Action: 1. Gen    │
                                    │          new QR   │
                                    │         2. Retry  │
                                    │          counter  │
                                    │         3. Emit   │
                                    │          refresh  │
                                    │ Log: "QR expired, │
                                    │       regenerate" │
                                    └─────────┬─────────┘
                                              │
                                              │ retry < max
                                              ▼
                                         Q2: QR_CODE_
                                            GENERATED
```

### 2.2 Event Details

#### Q1: QR_MODE_INITIATED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | No valid session detected AND auth method = QR |
| **Handler Action** | 1. Set internal state to `AWAITING_QR`<br>2. Initialize QR retry counter<br>3. Setup timeout handler<br>4. Emit `qr_auth_started` event |
| **Next State** | `AWAITING_QR` |
| **Error Handling** | Log and transition to ERROR if init fails |
| **Logging** | `level: info`<br>`message: "QR authentication flow initiated"`<br>`context: { timeoutMs, maxRetries }` |

```typescript
// Event Payload
interface QRModeInitiatedEvent {
  timestamp: number;
  authDir: string;
  timeoutMs: number;
  maxRetries: number;
}
```

#### Q2: QR_CODE_GENERATED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | `connection.update` event dengan field `qr` |
| **Handler Action** | 1. Extract QR string dari event<br>2. Convert ke base64 PNG (`jimp` atau `qrcode`)<br>3. Generate data URL<br>4. Emit QR ke semua listeners<br>5. Start/reset timeout timer |
| **Next State** | `AWAITING_QR` (sama) |
| **Error Handling** | - `QR_GENERATION_FAILED`: Log, retry generate<br>- `IMAGE_CONVERT_FAILED`: Send raw QR string instead |
| **Logging** | `level: info`<br>`message: "QR code generated"`<br>`context: { qrLength, attempt, expiresIn }` |

```typescript
// Event Payload
interface QRCodeGeneratedEvent {
  timestamp: number;
  qrString: string;  // Raw QR data
  qrDataUrl: string; // data:image/png;base64,...
  attempt: number;
  expiresAt: number;
  timeoutAt: number;
}

// QR Generation Function
async function generateQRImage(qrString: string): Promise<string> {
  const qrImage = await QRCode.toDataURL(qrString, {
    type: 'image/png',
    width: 256,
    margin: 2,
    errorCorrectionLevel: 'M'
  });
  return qrImage;
}
```

#### Q3: QR_CODE_DISPLAYED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | QR successfully delivered ke display channel |
| **Handler Action** | 1. Log delivery confirmation<br>2. Start scan wait timer<br>3. Update UI state jika applicable |
| **Next State** | `AWAITING_QR` (sama) |
| **Error Handling** | - `DISPLAY_FAILED`: Retry display, fallback ke terminal |
| **Logging** | `level: debug`<br>`message: "QR displayed to user"`<br>`context: { channel, displayMethod }` |

#### Q4: QR_SCANNED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | `connection.update` event dengan `connection: 'open'` setelah QR |
| **Handler Action** | 1. Clear timeout timer<br>2. Log scan confirmation<br>3. Prepare untuk credential save |
| **Next State** | `AUTHENTICATING` |
| **Error Handling** | N/A - Happy path |
| **Logging** | `level: info`<br>`message: "QR code scanned successfully"`<br>`context: { scanDurationMs }` |

```typescript
// Event Payload
interface QRScannedEvent {
  timestamp: number;
  scanDurationMs: number;
  attempt: number;
}
```

#### Q5: AUTH_SUCCESS (QR)

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Credentials received dan connection established |
| **Handler Action** | 1. Save credentials ke storage<br>2. Create backup of credentials<br>3. Extract user JID<br>4. Emit `auth_success` event<br>5. Transition ke CONNECTED |
| **Next State** | `CONNECTED` |
| **Error Handling** | - `CREDS_SAVE_FAILED`: Retry dengan queue, log warning |
| **Logging** | `level: info`<br>`message: "Authentication successful via QR"`<br>`context: { jid, method: 'qr' }` |

```typescript
// Event Payload
interface AuthSuccessEvent {
  timestamp: number;
  method: 'qr' | 'pairing';
  jid: string;
  pushName: string;
  platform: string;
  attemptCount: number;
  totalDurationMs: number;
}
```

#### Q6: QR_TIMEOUT

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Timeout timer expires sebelum QR di-scan |
| **Handler Action** | 1. Clear timeout timer<br>2. Check retry count<br>3. If retries available: regenerate QR<br>4. If max retries: emit timeout, close socket |
| **Next State** | `ERROR` atau retry ke `AWAITING_QR` |
| **Error Handling** | Emit `QR_AUTH_TIMEOUT` event ke client |
| **Logging** | `level: warn`<br>`message: "QR code timeout"`<br>`context: { attempt, maxAttempts, willRetry }` |

```typescript
// Event Payload
interface QRTimeoutEvent {
  timestamp: number;
  attempt: number;
  maxAttempts: number;
  totalWaitMs: number;
  willRetry: boolean;
}
```

#### Q7: QR_EXPIRED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | WhatsApp mengirim QR baru (QR sebelumnya expired) |
| **Handler Action** | 1. Increment retry counter<br>2. Generate new QR image<br>3. Emit QR refresh event<br>4. Reset timeout timer |
| **Next State** | `AWAITING_QR` (sama) |
| **Error Handling** | If max retries reached, transition to ERROR |
| **Logging** | `level: info`<br>`message: "QR expired, generating new code"`<br>`context: { attempt, maxAttempts }` |

---

## 3. Auth Lifecycle - Pairing Code Mode

### 3.1 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PAIRING CODE AUTH LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────────┘

      SOCKET_CREATED
      (no session)
           │
           ▼
┌───────────────────┐
│  P1: PAIRING_     │   Trigger: No session + Pairing mode + phone number
│     MODE_INIT     │   Action:  Request pairing code from WA
│                   │   Log:     "Starting pairing code flow"
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  P2: PHONE_       │   Trigger: After pairing mode init
│     VALIDATED     │   Action:  Validate E.164 format
│                   │   Log:     "Phone number validated: +xxx"
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  P3: PAIRING_     │   Trigger: sock.requestPairingCode() called
│     REQUESTED     │   Action:  Send request to WA servers
│                   │   Log:     "Pairing code requested"
└─────────┬─────────┘
          │
          ├─────────────── error ────────────────┐
          │                                      │
          ▼                                      ▼
┌───────────────────┐             ┌───────────────────────┐
│  P4: PAIRING_     │             │  P8: PAIRING_         │
│     CODE_RECEIVED │             │     REQUEST_FAILED    │
│                   │             │                       │
│ Action: Display   │             │ Action: 1. Log error  │
│   8-digit code    │             │         2. Retry or   │
│ Log: "Code: XXXX- │             │            fallback   │
│       XXXX"       │             │ Log: "Request failed" │
└─────────┬─────────┘             └───────────┬───────────┘
          │                                   │
          │ wait                              │ retry?
          ▼                                   ▼
┌───────────────────┐                    [RETRY or
│  P5: AWAITING_    │                     QR FALLBACK]
│     CONFIRMATION  │
│                   │
│ Action: Wait for  │
│   user to enter   │
│   code in WA app  │
│ Log: "Waiting..." │
└─────────┬─────────┘
          │
          ├─────────────── timeout ───────────┐
          │                                   │
          ▼                                   ▼
┌───────────────────┐           ┌───────────────────┐
│  P6: PAIRING_     │           │  P7: PAIRING_     │
│     CONFIRMED     │           │     TIMEOUT       │
│                   │           │                   │
│ Action: 1. Save   │           │ Action: 1. Cancel │
│          creds    │           │         2. Retry? │
│         2. Emit   │           │         3. Error  │
│          success  │           │ Log: "Timeout"    │
│ Log: "Paired OK"  │           └─────────┬─────────┘
└─────────┬─────────┘                     │
          │                               │
          ▼                               ▼
    ┌───────────┐                   ┌───────────┐
    │ CONNECTED │                   │   ERROR   │
    └───────────┘                   └───────────┘
```

### 3.2 Event Details

#### P1: PAIRING_MODE_INITIATED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | No valid session AND auth method = pairing AND phone number provided |
| **Handler Action** | 1. Validate phone number format<br>2. Set state to `AWAITING_PAIRING`<br>3. Initialize timeout timer<br>4. Prepare pairing request |
| **Next State** | `AWAITING_PAIRING` |
| **Error Handling** | - `INVALID_PHONE`: Emit error dengan format hint<br>- `PAIRING_NOT_SUPPORTED`: Fallback to QR |
| **Logging** | `level: info`<br>`message: "Pairing code authentication initiated"`<br>`context: { phoneNumberMasked }` |

```typescript
// Event Payload
interface PairingModeInitiatedEvent {
  timestamp: number;
  phoneNumber: string; // Masked: +62****5678
  timeoutMs: number;
}

// Phone Number Validation
function validateE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}
```

#### P2: PHONE_VALIDATED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Phone number passes E.164 validation |
| **Handler Action** | 1. Format phone number<br>2. Remove any formatting chars<br>3. Store untuk pairing request |
| **Next State** | Same (preparing) |
| **Error Handling** | Emit validation error jika format invalid |
| **Logging** | `level: debug`<br>`message: "Phone number validated"`<br>`context: { phoneNumberMasked, countryCode }` |

#### P3: PAIRING_REQUESTED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Valid phone number, socket ready |
| **Handler Action** | 1. Call `sock.requestPairingCode(phoneNumber)`<br>2. Start request timeout<br>3. Wait untuk response |
| **Next State** | Waiting for response |
| **Error Handling** | - `REQUEST_TIMEOUT`: Retry atau fallback<br>- `RATE_LIMITED`: Wait dan retry<br>- `INVALID_NUMBER`: Emit error |
| **Logging** | `level: info`<br>`message: "Pairing code request sent"`<br>`context: { phoneNumberMasked }` |

```typescript
// Pairing Code Request
async function requestPairingCode(sock: WASocket, phoneNumber: string): Promise<string> {
  // Remove '+' prefix jika ada
  const cleanNumber = phoneNumber.replace(/^\+/, '');

  try {
    const code = await sock.requestPairingCode(cleanNumber);
    return code;
  } catch (err) {
    throw new PairingRequestError(formatError(err));
  }
}
```

#### P4: PAIRING_CODE_RECEIVED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | `requestPairingCode()` returns successfully |
| **Handler Action** | 1. Format code dengan separator (XXXX-XXXX)<br>2. Emit code ke client/display<br>3. Log masked code<br>4. Start confirmation timeout |
| **Next State** | `AWAITING_PAIRING` |
| **Error Handling** | N/A - Code received successfully |
| **Logging** | `level: info`<br>`message: "Pairing code received"`<br>`context: { codeFormat: "XXXX-XXXX", expiresIn }` |

```typescript
// Event Payload
interface PairingCodeReceivedEvent {
  timestamp: number;
  code: string;           // "1234-5678"
  codeMasked: string;     // "****-****" (for logs)
  expiresAt: number;
  phoneNumberMasked: string;
}

// Code Formatting
function formatPairingCode(code: string): string {
  // Assuming 8 digit code
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
```

#### P5: AWAITING_CONFIRMATION

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Pairing code displayed ke user |
| **Handler Action** | 1. Monitor `connection.update` untuk confirmation<br>2. Keep timeout timer running<br>3. Listen untuk user input in WA app |
| **Next State** | `AWAITING_PAIRING` (sama) |
| **Error Handling** | - `CONFIRMATION_FAILED`: Log, notify user |
| **Logging** | `level: debug`<br>`message: "Waiting for user to enter pairing code in WhatsApp"`<br>`context: { waitingSince, timeoutAt }` |

#### P6: PAIRING_CONFIRMED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | `connection.update` dengan `connection: 'open'` setelah pairing |
| **Handler Action** | 1. Clear timeout timer<br>2. Save credentials<br>3. Create credential backup<br>4. Extract user JID<br>5. Emit `auth_success` event<br>6. Transition ke CONNECTED |
| **Next State** | `CONNECTED` |
| **Error Handling** | - `CREDS_SAVE_FAILED`: Retry dengan queue |
| **Logging** | `level: info`<br>`message: "Pairing confirmed successfully"`<br>`context: { jid, method: 'pairing', confirmDurationMs }` |

```typescript
// Event Payload
interface PairingConfirmedEvent {
  timestamp: number;
  jid: string;
  pushName: string;
  phoneNumber: string;
  confirmDurationMs: number;
}
```

#### P7: PAIRING_TIMEOUT

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Timeout timer expires sebelum confirmation |
| **Handler Action** | 1. Clear timeout<br>2. Check retry count<br>3. If retries: request new code<br>4. If max retries: emit error, suggest QR fallback |
| **Next State** | `ERROR` atau retry |
| **Error Handling** | Emit `PAIRING_AUTH_TIMEOUT` event |
| **Logging** | `level: warn`<br>`message: "Pairing confirmation timeout"`<br>`context: { attempt, maxAttempts, suggestQRFallback }` |

#### P8: PAIRING_REQUEST_FAILED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | `requestPairingCode()` throws error |
| **Handler Action** | 1. Parse error type<br>2. Determine if retryable<br>3. Emit appropriate error event<br>4. Suggest QR fallback jika persistent |
| **Next State** | Retry atau `ERROR` |
| **Error Handling** | - `RATE_LIMITED`: Wait 60s, retry<br>- `INVALID_NUMBER`: Show error, no retry<br>- `SERVER_ERROR`: Retry dengan backoff |
| **Logging** | `level: error`<br>`message: "Pairing code request failed"`<br>`context: { errorType, errorMessage, willRetry }` |

```typescript
// Error Types
enum PairingErrorType {
  RATE_LIMITED = 'rate_limited',
  INVALID_NUMBER = 'invalid_number',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNSUPPORTED = 'unsupported',
}
```

---

## 4. Reconnect Lifecycle

### 4.1 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RECONNECT LIFECYCLE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

      CONNECTED
          │
          │ connection lost
          ▼
┌───────────────────┐
│  R1: CONNECTION_  │   Trigger: connection.update → connection: 'close'
│     LOST          │   Action:  1. Determine error type
│                   │            2. Check if reconnectable
│                   │   Log:     "Connection lost: {reason}"
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  R2: DISCONNECT_  │   Trigger: After connection lost detected
│     ANALYZED      │   Action:  Analyze error code & determine strategy
│                   │   Log:     "Disconnect reason: {code}, {strategy}"
└─────────┬─────────┘
          │
          ├─── reconnectable ───────────────────┐
          │                                     │
          ▼                                     ▼
┌───────────────────┐             ┌───────────────────────┐
│  R3: RECONNECT_   │             │  R9: LOGGED_OUT       │
│     SCHEDULED     │             │      DETECTED         │
│                   │             │                       │
│ Action: Schedule  │             │ Action: 1. Clear      │
│   reconnect with  │             │          session      │
│   backoff delay   │             │         2. Emit       │
│ Log: "Reconnect   │             │          logout event │
│   in {delay}ms"   │             │ Log: "User logged out,│
└─────────┬─────────┘             │       re-auth needed" │
          │                       └───────────┬───────────┘
          │ delay elapsed                     │
          ▼                                   │
┌───────────────────┐                         │
│  R4: RECONNECT_   │                         │
│     ATTEMPTING    │                         │
│                   │                         │
│ Action: 1. Close  │                         │
│          old sock │                         │
│         2. Create │                         │
│          new sock │                         │
│ Log: "Attempting  │                         │
│   reconnect #{n}" │                         │
└─────────┬─────────┘                         │
          │                                   │
          ├─── success ───────────┐           │
          │                       │           │
          ▼                       ▼           │
┌───────────────────┐   ┌───────────────────┐ │
│  R5: RECONNECT_   │   │  R6: RECONNECT_   │ │
│     FAILED        │   │     SUCCESS       │ │
│                   │   │                   │ │
│ Action: 1. Check  │   │ Action: 1. Clear  │ │
│          retries  │   │          counters │ │
│         2. Inc    │   │         2. Emit   │ │
│          backoff  │   │          success  │ │
│ Log: "Attempt     │   │ Log: "Reconnected │ │
│   failed: {err}"  │   │       as {jid}"   │ │
└─────────┬─────────┘   └─────────┬─────────┘ │
          │                       │           │
          │ retry < max           │           │
          ▼                       ▼           │
     R3: RECONNECT_         ┌───────────┐     │
        SCHEDULED           │ CONNECTED │     │
                            └───────────┘     │
          │                                   │
          │ retry >= max                      │
          ▼                                   │
┌───────────────────┐                         │
│  R7: RECONNECT_   │                         │
│     EXHAUSTED     │                         │
│                   │                         │
│ Action: 1. Stop   │                         │
│          retries  │                         │
│         2. Emit   │                         │
│          failure  │                         │
│ Log: "Max retries │                         │
│       reached"    │                         │
└─────────┬─────────┘                         │
          │                                   │
          ▼                                   ▼
┌─────────────────────────────────────────────────────┐
│                      ERROR STATE                     │
│  (requires manual intervention or re-authentication) │
└─────────────────────────────────────────────────────┘
```

### 4.2 Event Details

#### R1: CONNECTION_LOST

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | `connection.update` event dengan `connection: 'close'` |
| **Handler Action** | 1. Extract error dari `lastDisconnect`<br>2. Get status code<br>3. Log disconnect reason<br>4. Emit `connection_lost` event |
| **Next State** | `RECONNECTING` |
| **Error Handling** | Catch any extraction errors, log safely |
| **Logging** | `level: warn`<br>`message: "Connection lost"`<br>`context: { statusCode, reason, wasConnectedFor }` |

```typescript
// Event Payload
interface ConnectionLostEvent {
  timestamp: number;
  statusCode: number | undefined;
  reason: string;
  error: Error | undefined;
  wasConnectedForMs: number;
  sessionAge: number;
}

// Status Code Extraction
function getStatusCode(err: unknown): number | undefined {
  return (
    (err as any)?.output?.statusCode ??
    (err as any)?.status ??
    (err as any)?.error?.output?.statusCode
  );
}
```

#### R2: DISCONNECT_ANALYZED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | After CONNECTION_LOST, error extracted |
| **Handler Action** | 1. Map status code ke disconnect reason<br>2. Determine reconnect strategy<br>3. Check if logged out (status 401/403/515) |
| **Next State** | Depends on analysis |
| **Error Handling** | Default to reconnectable if unknown status |
| **Logging** | `level: info`<br>`message: "Disconnect analyzed"`<br>`context: { statusCode, reason, isReconnectable, isLoggedOut }` |

```typescript
// Disconnect Reason Mapping
const DISCONNECT_REASONS: Record<number, DisconnectInfo> = {
  401: { reason: 'unauthorized', reconnectable: false, requiresReauth: true },
  403: { reason: 'forbidden', reconnectable: false, requiresReauth: true },
  408: { reason: 'request_timeout', reconnectable: true, requiresReauth: false },
  428: { reason: 'connection_closed', reconnectable: true, requiresReauth: false },
  440: { reason: 'connection_replaced', reconnectable: false, requiresReauth: false },
  500: { reason: 'server_error', reconnectable: true, requiresReauth: false },
  501: { reason: 'service_unavailable', reconnectable: true, requiresReauth: false },
  515: { reason: 'restart_required', reconnectable: true, requiresReauth: false },
};

// Logged Out Status Code (dari Baileys)
const LOGGED_OUT_STATUS = 401;
```

#### R3: RECONNECT_SCHEDULED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Disconnect analyzed as reconnectable |
| **Handler Action** | 1. Calculate backoff delay<br>2. Schedule reconnect timer<br>3. Emit `reconnect_scheduled` event |
| **Next State** | `RECONNECTING` (waiting) |
| **Error Handling** | N/A |
| **Logging** | `level: info`<br>`message: "Reconnect scheduled"`<br>`context: { delayMs, attempt, maxAttempts }` |

```typescript
// Exponential Backoff Configuration
interface BackoffConfig {
  baseDelayMs: number;      // 1000 (1 second)
  maxDelayMs: number;       // 60000 (1 minute)
  multiplier: number;       // 2
  jitterFactor: number;     // 0.1 (10% jitter)
}

// Calculate Backoff Delay
function calculateBackoff(attempt: number, config: BackoffConfig): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(config.multiplier, attempt - 1),
    config.maxDelayMs
  );
  const jitter = delay * config.jitterFactor * Math.random();
  return Math.floor(delay + jitter);
}

// Event Payload
interface ReconnectScheduledEvent {
  timestamp: number;
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  reconnectAt: number;
  backoffConfig: BackoffConfig;
}
```

#### R4: RECONNECT_ATTEMPTING

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Backoff delay elapsed |
| **Handler Action** | 1. Close existing socket gracefully<br>2. Wait untuk credential save queue<br>3. Create new socket<br>4. Attach handlers<br>5. Attempt connection |
| **Next State** | Attempting... |
| **Error Handling** | Catch socket creation errors, schedule retry |
| **Logging** | `level: info`<br>`message: "Attempting reconnect"`<br>`context: { attempt, maxAttempts }` |

```typescript
// Reconnect Attempt
async function attemptReconnect(
  authDir: string,
  attempt: number,
  config: ReconnectConfig
): Promise<WASocket> {
  // Wait for any pending credential saves
  await waitForCredsSaveQueue(authDir);

  // Create new socket
  const sock = await createWaSocket(false, config.verbose, { authDir });

  // Wait for connection with timeout
  await Promise.race([
    waitForConnection(sock),
    sleep(config.connectTimeoutMs).then(() => {
      throw new Error('Connection timeout');
    })
  ]);

  return sock;
}
```

#### R5: RECONNECT_FAILED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Socket creation atau connection fails |
| **Handler Action** | 1. Log failure reason<br>2. Increment attempt counter<br>3. Increase backoff delay<br>4. Check if more retries available<br>5. Schedule next attempt atau give up |
| **Next State** | `RECONNECTING` (if retry) atau `ERROR` |
| **Error Handling** | Log error, determine if retryable |
| **Logging** | `level: warn`<br>`message: "Reconnect attempt failed"`<br>`context: { attempt, error, willRetry, nextDelayMs }` |

```typescript
// Event Payload
interface ReconnectFailedEvent {
  timestamp: number;
  attempt: number;
  maxAttempts: number;
  error: string;
  errorCode: number | undefined;
  willRetry: boolean;
  nextDelayMs: number | undefined;
}
```

#### R6: RECONNECT_SUCCESS

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | New socket connects successfully |
| **Handler Action** | 1. Clear retry counter<br>2. Reset backoff<br>3. Update connection timestamp<br>4. Emit `reconnected` event<br>5. Send presence update |
| **Next State** | `CONNECTED` |
| **Error Handling** | N/A - Success path |
| **Logging** | `level: info`<br>`message: "Reconnected successfully"`<br>`context: { jid, attempt, totalDowntimeMs }` |

```typescript
// Event Payload
interface ReconnectSuccessEvent {
  timestamp: number;
  jid: string;
  attempt: number;
  totalDowntimeMs: number;
  reconnectDurationMs: number;
}
```

#### R7: RECONNECT_EXHAUSTED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Max reconnect attempts reached |
| **Handler Action** | 1. Stop retry loop<br>2. Emit `reconnect_exhausted` event<br>3. Log final state<br>4. Transition to ERROR |
| **Next State** | `ERROR` |
| **Error Handling** | Emit event untuk external handling |
| **Logging** | `level: error`<br>`message: "Reconnect attempts exhausted"`<br>`context: { totalAttempts, totalDowntimeMs, lastError }` |

```typescript
// Event Payload
interface ReconnectExhaustedEvent {
  timestamp: number;
  totalAttempts: number;
  totalDowntimeMs: number;
  lastError: string;
  requiresManualIntervention: boolean;
}
```

#### R9: LOGGED_OUT_DETECTED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Status code 401 atau 403 detected |
| **Handler Action** | 1. Clear session data<br>2. Delete credentials<br>3. Emit `logged_out` event<br>4. Prepare for re-authentication |
| **Next State** | `LOGGED_OUT` |
| **Error Handling** | Ensure session cleanup complete |
| **Logging** | `level: warn`<br>`message: "User logged out from WhatsApp"`<br>`context: { statusCode, requiresReauth: true }` |

```typescript
// Event Payload
interface LoggedOutEvent {
  timestamp: number;
  statusCode: number;
  reason: 'unauthorized' | 'forbidden' | 'revoked';
  sessionCleared: boolean;
  requiresReauth: boolean;
}
```

---

## 5. Shutdown Lifecycle

### 5.1 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SHUTDOWN LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

      CONNECTED / RECONNECTING / ERROR
                    │
                    │ shutdown request (SIGTERM, SIGINT, manual)
                    ▼
┌───────────────────────────────┐
│  S1: SHUTDOWN_REQUESTED       │   Trigger: SIGTERM, SIGINT, atau manual call
│                               │   Action:  1. Set shutting down flag
│                               │            2. Stop accepting new requests
│                               │   Log:     "Shutdown requested"
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│  S2: PENDING_OPERATIONS_      │   Trigger: After shutdown flag set
│     COMPLETING                │   Action:  Wait for in-flight operations
│                               │   Log:     "Waiting for {n} operations"
└─────────────┬─────────────────┘
              │
              │ operations complete / timeout
              ▼
┌───────────────────────────────┐
│  S3: SESSION_SAVING           │   Trigger: Operations complete
│                               │   Action:  1. Flush credential queue
│                               │            2. Create final backup
│                               │   Log:     "Saving session state"
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│  S4: PRESENCE_UPDATING        │   Trigger: Session saved
│                               │   Action:  Send 'unavailable' presence
│                               │   Log:     "Updating presence to offline"
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│  S5: SOCKET_CLOSING           │   Trigger: Presence updated
│                               │   Action:  1. Close WebSocket
│                               │            2. Cleanup event handlers
│                               │   Log:     "Closing WebSocket connection"
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│  S6: RESOURCES_CLEANUP        │   Trigger: Socket closed
│                               │   Action:  1. Clear timers
│                               │            2. Clear caches
│                               │            3. Close file handles
│                               │   Log:     "Cleaning up resources"
└─────────────┬─────────────────┘
              │
              ▼
┌───────────────────────────────┐
│  S7: SHUTDOWN_COMPLETE        │   Trigger: All cleanup done
│                               │   Action:  Emit 'shutdown_complete' event
│                               │   Log:     "WhatsApp service shutdown complete"
└─────────────┬─────────────────┘
              │
              ▼
         ┌─────────┐
         │  IDLE   │
         └─────────┘
```

### 5.2 Event Details

#### S1: SHUTDOWN_REQUESTED

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | SIGTERM, SIGINT signal atau manual `shutdown()` call |
| **Handler Action** | 1. Set `isShuttingDown = true`<br>2. Stop accepting new message handlers<br>3. Cancel scheduled reconnects<br>4. Emit `shutdown_started` event |
| **Next State** | `DISCONNECTING` |
| **Error Handling** | Force shutdown after timeout |
| **Logging** | `level: info`<br>`message: "Shutdown requested"`<br>`context: { reason, signal, gracefulTimeoutMs }` |

```typescript
// Event Payload
interface ShutdownRequestedEvent {
  timestamp: number;
  reason: 'signal' | 'manual' | 'error' | 'restart';
  signal?: 'SIGTERM' | 'SIGINT';
  gracefulTimeoutMs: number;
  pendingOperations: number;
}

// Shutdown Handler Setup
function setupShutdownHandlers(service: WhatsAppService) {
  const shutdown = async (signal: string) => {
    service.logger.info({ signal }, 'Shutdown signal received');
    await service.gracefulShutdown(signal);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```

#### S2: PENDING_OPERATIONS_COMPLETING

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Shutdown requested, checking pending ops |
| **Handler Action** | 1. Count in-flight operations<br>2. Wait for completion dengan timeout<br>3. Force complete after timeout |
| **Next State** | Same (waiting) |
| **Error Handling** | Force proceed after graceful timeout |
| **Logging** | `level: debug`<br>`message: "Waiting for pending operations"`<br>`context: { pendingCount, timeoutMs }` |

```typescript
// Wait for Pending Operations
async function waitForPendingOperations(
  pendingOps: Set<Promise<any>>,
  timeoutMs: number
): Promise<void> {
  if (pendingOps.size === 0) return;

  await Promise.race([
    Promise.allSettled([...pendingOps]),
    sleep(timeoutMs)
  ]);
}
```

#### S3: SESSION_SAVING

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Pending operations complete atau timeout |
| **Handler Action** | 1. Wait for credential save queue<br>2. Force flush if needed<br>3. Create backup of current credentials<br>4. Verify backup integrity |
| **Next State** | Session saved |
| **Error Handling** | Log warning if save fails, proceed anyway |
| **Logging** | `level: info`<br>`message: "Saving session state"`<br>`context: { credsSaved, backupCreated }` |

```typescript
// Session Save
async function saveSessionOnShutdown(authDir: string): Promise<boolean> {
  try {
    // Wait for any pending saves
    await waitForCredsSaveQueueWithTimeout(authDir, 5000);

    // Create backup
    const credsPath = path.join(authDir, 'creds.json');
    const backupPath = path.join(authDir, 'creds.backup.json');

    if (fs.existsSync(credsPath)) {
      fs.copyFileSync(credsPath, backupPath);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
```

#### S4: PRESENCE_UPDATING

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Session saved |
| **Handler Action** | 1. Send `unavailable` presence<br>2. Wait for confirmation<br>3. Timeout jika no response |
| **Next State** | Presence updated |
| **Error Handling** | Proceed jika presence update fails |
| **Logging** | `level: debug`<br>`message: "Updating presence to offline"`<br>`context: { success }` |

```typescript
// Update Presence on Shutdown
async function updatePresenceOffline(sock: WASocket): Promise<void> {
  try {
    await Promise.race([
      sock.sendPresenceUpdate('unavailable'),
      sleep(2000) // 2 second timeout
    ]);
  } catch (err) {
    // Ignore errors - best effort
  }
}
```

#### S5: SOCKET_CLOSING

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Presence updated atau timeout |
| **Handler Action** | 1. Close WebSocket connection<br>2. Remove all event listeners<br>3. Null out socket reference |
| **Next State** | Socket closed |
| **Error Handling** | Force close after timeout |
| **Logging** | `level: info`<br>`message: "Closing WebSocket connection"`<br>`context: { cleanClose }` |

```typescript
// Close Socket
async function closeSocket(sock: WASocket | null): Promise<void> {
  if (!sock) return;

  try {
    // Remove all event listeners first
    sock.ev.removeAllListeners('connection.update');
    sock.ev.removeAllListeners('creds.update');
    sock.ev.removeAllListeners('messages.upsert');

    // Close WebSocket
    sock.ws?.close();

    // Force terminate after timeout
    await sleep(1000);
    sock.ws?.terminate();
  } catch (err) {
    // Force close
    try {
      sock.ws?.terminate();
    } catch {}
  }
}
```

#### S6: RESOURCES_CLEANUP

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | Socket closed |
| **Handler Action** | 1. Clear all timers<br>2. Clear message cache<br>3. Clear deduplication maps<br>4. Close file handles<br>5. Release memory |
| **Next State** | Resources cleaned |
| **Error Handling** | Log errors but proceed |
| **Logging** | `level: debug`<br>`message: "Cleaning up resources"`<br>`context: { timersCleared, cachesCleared }` |

```typescript
// Resource Cleanup
function cleanupResources(state: ServiceState): void {
  // Clear all timers
  state.timers.forEach(timer => clearTimeout(timer));
  state.timers.clear();

  // Clear intervals
  state.intervals.forEach(interval => clearInterval(interval));
  state.intervals.clear();

  // Clear caches
  state.messageCache.clear();
  state.dedupeMap.clear();

  // Nullify references
  state.sock = null;
  state.authState = null;
}
```

#### S7: SHUTDOWN_COMPLETE

| Attribute | Value |
|-----------|-------|
| **Trigger Condition** | All cleanup complete |
| **Handler Action** | 1. Log final summary<br>2. Emit `shutdown_complete` event<br>3. Reset state ke IDLE |
| **Next State** | `IDLE` |
| **Error Handling** | N/A - Final state |
| **Logging** | `level: info`<br>`message: "WhatsApp service shutdown complete"`<br>`context: { totalUptime, messagesProcessed }` |

```typescript
// Event Payload
interface ShutdownCompleteEvent {
  timestamp: number;
  totalUptimeMs: number;
  messagesProcessed: number;
  cleanShutdown: boolean;
  finalState: {
    sessionSaved: boolean;
    backupCreated: boolean;
    socketClosed: boolean;
    resourcesCleaned: boolean;
  };
}
```

---

## Event Reference Table

### Quick Reference: All Events

| Event Code | Event Name | Trigger | Next State | Severity |
|------------|------------|---------|------------|----------|
| **Startup** |
| E1 | SERVICE_START | App boot | INITIALIZING | INFO |
| E2 | CONFIG_LOADED | After E1 | SESSION_LOADING | INFO |
| E3 | SESSION_CHECK | After E2 | Depends | DEBUG |
| E4A | SESSION_FOUND | Valid session | AUTHENTICATING | INFO |
| E4B | SESSION_NOT_FOUND | No session | AWAITING_* | INFO |
| E5 | SOCKET_CREATING | After session check | Creating | DEBUG |
| E6 | SOCKET_CREATED | Socket ready | Depends | INFO |
| E7 | AUTO_CONNECTING | Has creds | AUTHENTICATING | INFO |
| E8 | CONNECTION_ESTABLISHED | Connected | CONNECTED | INFO |
| **QR Auth** |
| Q1 | QR_MODE_INITIATED | No session, QR mode | AWAITING_QR | INFO |
| Q2 | QR_CODE_GENERATED | QR received | AWAITING_QR | INFO |
| Q3 | QR_CODE_DISPLAYED | QR shown | AWAITING_QR | DEBUG |
| Q4 | QR_SCANNED | User scans | AUTHENTICATING | INFO |
| Q5 | AUTH_SUCCESS | Auth complete | CONNECTED | INFO |
| Q6 | QR_TIMEOUT | Timer expires | ERROR/Retry | WARN |
| Q7 | QR_EXPIRED | WA sends new QR | AWAITING_QR | INFO |
| **Pairing Auth** |
| P1 | PAIRING_MODE_INIT | No session, pairing | AWAITING_PAIRING | INFO |
| P2 | PHONE_VALIDATED | Valid phone | Same | DEBUG |
| P3 | PAIRING_REQUESTED | Request sent | Waiting | INFO |
| P4 | PAIRING_CODE_RECEIVED | Code received | AWAITING_PAIRING | INFO |
| P5 | AWAITING_CONFIRMATION | Waiting user | AWAITING_PAIRING | DEBUG |
| P6 | PAIRING_CONFIRMED | User confirms | CONNECTED | INFO |
| P7 | PAIRING_TIMEOUT | Timer expires | ERROR/Retry | WARN |
| P8 | PAIRING_REQUEST_FAILED | Request fails | ERROR/Retry | ERROR |
| **Reconnect** |
| R1 | CONNECTION_LOST | Socket closes | RECONNECTING | WARN |
| R2 | DISCONNECT_ANALYZED | Error analyzed | Depends | INFO |
| R3 | RECONNECT_SCHEDULED | Will retry | RECONNECTING | INFO |
| R4 | RECONNECT_ATTEMPTING | Timer fires | Attempting | INFO |
| R5 | RECONNECT_FAILED | Attempt fails | RECONNECTING/ERROR | WARN |
| R6 | RECONNECT_SUCCESS | Reconnected | CONNECTED | INFO |
| R7 | RECONNECT_EXHAUSTED | Max retries | ERROR | ERROR |
| R9 | LOGGED_OUT_DETECTED | 401/403 | LOGGED_OUT | WARN |
| **Shutdown** |
| S1 | SHUTDOWN_REQUESTED | Signal/manual | DISCONNECTING | INFO |
| S2 | PENDING_OPS_COMPLETING | Waiting ops | DISCONNECTING | DEBUG |
| S3 | SESSION_SAVING | Saving state | DISCONNECTING | INFO |
| S4 | PRESENCE_UPDATING | Update presence | DISCONNECTING | DEBUG |
| S5 | SOCKET_CLOSING | Closing socket | DISCONNECTING | INFO |
| S6 | RESOURCES_CLEANUP | Cleanup | DISCONNECTING | DEBUG |
| S7 | SHUTDOWN_COMPLETE | All done | IDLE | INFO |

---

## Error Codes & Recovery

### Baileys Status Codes

| Code | Name | Recoverable | Action |
|------|------|-------------|--------|
| 401 | Unauthorized | No | Re-authenticate |
| 403 | Forbidden | No | Re-authenticate |
| 408 | Request Timeout | Yes | Reconnect with backoff |
| 428 | Connection Closed | Yes | Reconnect immediately |
| 440 | Connection Replaced | No | Wait, manual reconnect |
| 500 | Server Error | Yes | Reconnect with backoff |
| 501 | Service Unavailable | Yes | Reconnect with longer backoff |
| 515 | Restart Required | Yes | Restart socket immediately |

### Recovery Strategies

```typescript
// Recovery Strategy Configuration
const RECOVERY_STRATEGIES: Record<number, RecoveryStrategy> = {
  401: {
    action: 'reauth',
    clearSession: true,
    reconnect: false,
  },
  403: {
    action: 'reauth',
    clearSession: true,
    reconnect: false,
  },
  408: {
    action: 'reconnect',
    clearSession: false,
    reconnect: true,
    backoff: { base: 1000, max: 30000 },
  },
  428: {
    action: 'reconnect',
    clearSession: false,
    reconnect: true,
    backoff: { base: 500, max: 5000 },
  },
  440: {
    action: 'wait',
    clearSession: false,
    reconnect: false,
    message: 'Another device connected',
  },
  515: {
    action: 'restart',
    clearSession: false,
    reconnect: true,
    immediate: true,
  },
};
```

---

## Implementation Guidelines

### 1. Event Emitter Setup

```typescript
// TypeScript Event Types
interface WhatsAppEvents {
  // Startup
  'service:start': ServiceStartEvent;
  'config:loaded': ConfigLoadedEvent;
  'session:found': SessionFoundEvent;
  'session:not_found': SessionNotFoundEvent;
  'socket:created': SocketCreatedEvent;
  'connection:established': ConnectionEstablishedEvent;

  // QR Auth
  'qr:generated': QRCodeGeneratedEvent;
  'qr:scanned': QRScannedEvent;
  'qr:timeout': QRTimeoutEvent;
  'qr:expired': QRExpiredEvent;

  // Pairing Auth
  'pairing:code_received': PairingCodeReceivedEvent;
  'pairing:confirmed': PairingConfirmedEvent;
  'pairing:timeout': PairingTimeoutEvent;
  'pairing:failed': PairingFailedEvent;

  // Auth Common
  'auth:success': AuthSuccessEvent;
  'auth:failed': AuthFailedEvent;

  // Connection
  'connection:lost': ConnectionLostEvent;
  'reconnect:scheduled': ReconnectScheduledEvent;
  'reconnect:attempting': ReconnectAttemptingEvent;
  'reconnect:success': ReconnectSuccessEvent;
  'reconnect:failed': ReconnectFailedEvent;
  'reconnect:exhausted': ReconnectExhaustedEvent;
  'logged_out': LoggedOutEvent;

  // Shutdown
  'shutdown:requested': ShutdownRequestedEvent;
  'shutdown:complete': ShutdownCompleteEvent;
}
```

### 2. State Machine Implementation

```typescript
// State Machine dengan finite states
enum ServiceState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  SESSION_LOADING = 'session_loading',
  AWAITING_QR = 'awaiting_qr',
  AWAITING_PAIRING = 'awaiting_pairing',
  AUTHENTICATING = 'authenticating',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error',
  LOGGED_OUT = 'logged_out',
}

// Valid transitions
const STATE_TRANSITIONS: Record<ServiceState, ServiceState[]> = {
  [ServiceState.IDLE]: [ServiceState.INITIALIZING],
  [ServiceState.INITIALIZING]: [ServiceState.SESSION_LOADING, ServiceState.ERROR],
  [ServiceState.SESSION_LOADING]: [
    ServiceState.AWAITING_QR,
    ServiceState.AWAITING_PAIRING,
    ServiceState.AUTHENTICATING,
    ServiceState.ERROR,
  ],
  [ServiceState.AWAITING_QR]: [ServiceState.AUTHENTICATING, ServiceState.ERROR],
  [ServiceState.AWAITING_PAIRING]: [ServiceState.AUTHENTICATING, ServiceState.ERROR],
  [ServiceState.AUTHENTICATING]: [ServiceState.CONNECTED, ServiceState.ERROR],
  [ServiceState.CONNECTED]: [ServiceState.RECONNECTING, ServiceState.DISCONNECTING, ServiceState.LOGGED_OUT],
  [ServiceState.RECONNECTING]: [ServiceState.CONNECTED, ServiceState.ERROR, ServiceState.DISCONNECTING],
  [ServiceState.DISCONNECTING]: [ServiceState.IDLE],
  [ServiceState.ERROR]: [ServiceState.IDLE, ServiceState.INITIALIZING],
  [ServiceState.LOGGED_OUT]: [ServiceState.IDLE, ServiceState.AWAITING_QR, ServiceState.AWAITING_PAIRING],
};
```

### 3. Logging Standards

```typescript
// Structured Logging dengan Pino
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Log dengan context
function logEvent(event: string, context: Record<string, any>) {
  logger.info({
    event,
    timestamp: Date.now(),
    ...context,
  });
}

// Example usage
logEvent('qr:generated', {
  attempt: 1,
  expiresIn: 30000,
  qrLength: 256,
});
```

### 4. Error Handling Pattern

```typescript
// Error Wrapper
class WhatsAppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public recoverable: boolean = false,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'WhatsAppError';
  }
}

// Error Handler
function handleError(err: unknown, state: ServiceState): ErrorHandlingResult {
  const formatted = formatError(err);
  const statusCode = getStatusCode(err);
  const strategy = RECOVERY_STRATEGIES[statusCode] || DEFAULT_STRATEGY;

  logger.error({
    event: 'error',
    error: formatted,
    statusCode,
    state,
    strategy: strategy.action,
  });

  return {
    error: formatted,
    statusCode,
    strategy,
    shouldReconnect: strategy.reconnect,
    shouldClearSession: strategy.clearSession,
  };
}
```

---

## Appendix: Complete Event Flow Example

### Scenario: Fresh Start dengan QR Authentication

```
Time    Event                    State              Log Output
────────────────────────────────────────────────────────────────────────────
0ms     SERVICE_START           IDLE → INIT        "WhatsApp service starting"
50ms    CONFIG_LOADED           INIT               "Config loaded: authDir=/storage/..."
100ms   SESSION_CHECK           SESSION_LOADING    "Checking session at /storage/..."
150ms   SESSION_NOT_FOUND       SESSION_LOADING    "No valid session found"
200ms   QR_MODE_INITIATED       AWAITING_QR        "Starting QR authentication flow"
250ms   SOCKET_CREATING         AWAITING_QR        "Creating WebSocket connection"
500ms   SOCKET_CREATED          AWAITING_QR        "Socket created, handlers attached"
1000ms  QR_CODE_GENERATED       AWAITING_QR        "QR code generated, waiting for scan"
1050ms  QR_CODE_DISPLAYED       AWAITING_QR        "QR displayed to user"
15000ms QR_SCANNED              AUTHENTICATING     "QR code scanned successfully"
15500ms AUTH_SUCCESS            CONNECTED          "Authentication successful via QR"
15550ms CONNECTION_ESTABLISHED  CONNECTED          "Connected as 628xxx@s.whatsapp.net"
────────────────────────────────────────────────────────────────────────────
```

### Scenario: Reconnection setelah Network Drop

```
Time    Event                    State              Log Output
────────────────────────────────────────────────────────────────────────────
0ms     CONNECTION_LOST         CONNECTED          "Connection lost: status=408"
50ms    DISCONNECT_ANALYZED     RECONNECTING       "Disconnect reason: request_timeout"
100ms   RECONNECT_SCHEDULED     RECONNECTING       "Reconnect scheduled in 1000ms"
1100ms  RECONNECT_ATTEMPTING    RECONNECTING       "Attempting reconnect #1"
2000ms  RECONNECT_FAILED        RECONNECTING       "Attempt failed: timeout"
2050ms  RECONNECT_SCHEDULED     RECONNECTING       "Reconnect scheduled in 2000ms"
4050ms  RECONNECT_ATTEMPTING    RECONNECTING       "Attempting reconnect #2"
5000ms  RECONNECT_SUCCESS       CONNECTED          "Reconnected successfully"
────────────────────────────────────────────────────────────────────────────
```

---

*Document generated by Event Lifecycle Designer - Agent 4/6*
*FASE 3 - WhatsApp SLA Baileys Integration*
