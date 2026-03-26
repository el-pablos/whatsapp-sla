# ARCHITECTURE DESIGN: Migrasi Auth Baileys

**Version:** 1.0.0
**Date:** 2026-03-26
**Author:** Architecture Agent
**Status:** APPROVED

---

## 1. Executive Summary

Dokumen ini mendefinisikan arsitektur teknis untuk migrasi autentikasi WhatsApp dari Cloud API ke Baileys library. Arsitektur ini dirancang untuk:

- **Reliability:** Session persistence dengan backup & recovery
- **Scalability:** Multi-account support dengan isolasi session
- **Maintainability:** Modular architecture dengan separation of concerns
- **Security:** Credential protection dengan proper file permissions

---

## 2. Component Diagrams

### 2.1 High-Level Architecture

```
+------------------------------------------------------------------+
|                         LARAVEL APPLICATION                       |
|  +------------------------------------------------------------+  |
|  |  Controllers  |  Services  |  Events  |  Queue Workers     |  |
|  +------------------------------------------------------------+  |
|            |              |               |                       |
|            v              v               v                       |
|  +------------------------------------------------------------+  |
|  |                   WhatsApp Service Layer                    |  |
|  |  +------------------+  +------------------+  +------------+ |  |
|  |  | SessionManager   |  | MessageProcessor |  | QRService  | |  |
|  |  +------------------+  +------------------+  +------------+ |  |
|  +------------------------------------------------------------+  |
|            |                                                      |
+------------|------------------------------------------------------+
             | HTTP API (REST)
             v
+------------------------------------------------------------------+
|                    NODE.JS BAILEYS SERVICE                        |
|  +------------------------------------------------------------+  |
|  |  Express Server (Port 3010)                                 |  |
|  |  +------------------+  +------------------+  +------------+ |  |
|  |  | SocketManager    |  | AuthHandler      |  | MessageAPI | |  |
|  |  +------------------+  +------------------+  +------------+ |  |
|  +------------------------------------------------------------+  |
|            |              |               |                       |
|            v              v               v                       |
|  +------------------------------------------------------------+  |
|  |  @whiskeysockets/baileys (v7.0.0-rc.9)                      |  |
|  |  +------------------+  +------------------+  +------------+ |  |
|  |  | WASocket         |  | MultiFileAuth    |  | SignalKeys | |  |
|  |  +------------------+  +------------------+  +------------+ |  |
|  +------------------------------------------------------------+  |
|            |                                                      |
+------------|------------------------------------------------------+
             | WebSocket (Signal Protocol)
             v
+------------------------------------------------------------------+
|                    WHATSAPP SERVERS                               |
|  +------------------------------------------------------------+  |
|  |  Signal Protocol  |  Message Relay  |  Media Storage       |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### 2.2 Communication Flow Diagram

```
+-------------+     +-------------+     +-------------+     +-------------+
|   Laravel   |     |   Node.js   |     |   Baileys   |     |  WhatsApp   |
|   Backend   |     |   Service   |     |   Socket    |     |   Server    |
+------+------+     +------+------+     +------+------+     +------+------+
       |                   |                   |                   |
       |  POST /api/auth/qr|                   |                   |
       |------------------>|                   |                   |
       |                   | createSocket()    |                   |
       |                   |------------------>|                   |
       |                   |                   | WebSocket Connect |
       |                   |                   |------------------>|
       |                   |                   |<------------------|
       |                   |                   | QR Data           |
       |                   |<------------------|                   |
       |<------------------| qr_data_url       |                   |
       | { qr: base64 }    |                   |                   |
       |                   |                   |                   |
       | [User scans QR]   |                   |                   |
       |                   |                   |                   |
       |                   |<------------------|                   |
       |                   | connection: open  |                   |
       |                   |------------------>|                   |
       |<------------------|                   | saveCreds()       |
       | { status: ok }    |                   |                   |
       |                   |                   |                   |
```

### 2.3 Message Flow Diagram

```
INBOUND MESSAGE FLOW:
=====================

WhatsApp Server                    Baileys Service                    Laravel Backend
      |                                  |                                  |
      | messages.upsert                  |                                  |
      |--------------------------------->|                                  |
      |                                  | Deduplicate                      |
      |                                  | Extract Content                  |
      |                                  | POST /webhook/message            |
      |                                  |--------------------------------->|
      |                                  |                                  | Process
      |                                  |                                  | Store DB
      |                                  |                                  | Dispatch Event
      |                                  |<---------------------------------|
      |                                  | { success: true }                |
      |                                  |                                  |


OUTBOUND MESSAGE FLOW:
======================

Laravel Backend                    Baileys Service                    WhatsApp Server
      |                                  |                                  |
      | POST /api/send                   |                                  |
      |--------------------------------->|                                  |
      |                                  | Validate                         |
      |                                  | sock.sendMessage()               |
      |                                  |--------------------------------->|
      |                                  |<---------------------------------|
      |                                  | Message ID                       |
      |<---------------------------------|                                  |
      | { messageId: xxx }               |                                  |
      |                                  |                                  |
```

### 2.4 Session Persistence & Recovery Flow

```
+------------------+     +------------------+     +------------------+
|  Session Start   |     |  Credential Save |     |  Session Restore |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| Check Session    |     | Validate JSON    |     | Check Backup     |
| Directory        |     | Before Backup    |     | If Main Corrupt  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| Restore From     |     | Copy to          |     | Restore From     |
| Backup if Needed |     | creds.backup.json|     | Backup File      |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| Load Auth State  |     | Save New Creds   |     | Re-authenticate  |
| useMultiFileAuth |     | chmod 0600       |     | If Both Fail     |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| Create Socket    |     | Queue Next Save  |     | Request QR/Pair  |
| With Cached Keys |     | To Prevent Race  |     | Code             |
+------------------+     +------------------+     +------------------+
```

---

## 3. Architecture Decisions

### 3.1 KEPUTUSAN: Hybrid Laravel + Node.js Architecture

**Status:** APPROVED

**Context:**
- Laravel backend sudah ada dengan business logic lengkap
- Baileys adalah library JavaScript yang tidak bisa di-port ke PHP
- Perlu integrasi yang seamless tanpa rewrite total

**Decision:**
Menggunakan **Hybrid Architecture** dengan Node.js Baileys Service sebagai sidecar.

**Rationale:**

| Opsi | Pros | Cons |
|------|------|------|
| **Pure Node.js Rewrite** | Single runtime, simpler deployment | Harus rewrite semua business logic, high risk |
| **Python + Node.js Bridge** | Python bot sudah ada | Double bridge (Python->Node->WA), complexity |
| **Laravel + Node.js Hybrid** | Leverage existing code, minimal change | Two runtimes, need inter-process communication |

**Pilihan: Laravel + Node.js Hybrid** karena:
1. **Minimize Risk:** Tidak perlu rewrite Laravel business logic
2. **Clear Separation:** Node.js hanya handle WhatsApp connection
3. **Production Proven:** Pola ini sudah dipakai di tam-store-bot
4. **Maintainability:** Tim familiar dengan Laravel, Node.js hanya untuk WA

### 3.2 KEPUTUSAN: Communication Protocol - HTTP REST

**Status:** APPROVED

**Options Evaluated:**

| Protocol | Latency | Complexity | Debugging | Resilience |
|----------|---------|------------|-----------|------------|
| HTTP REST | Medium | Low | Easy | High |
| WebSocket | Low | Medium | Medium | Medium |
| Redis Pub/Sub | Low | Medium | Medium | High |
| gRPC | Low | High | Hard | High |

**Decision:** HTTP REST dengan optional WebSocket untuk real-time events

**Rationale:**
1. **Simplicity:** REST familiar untuk tim, mudah di-debug
2. **Tooling:** Easy to test dengan curl, Postman
3. **Resilience:** Stateless, easy retry on failure
4. **Monitoring:** Standard HTTP metrics (response time, status codes)

**Trade-off:** Latency sedikit lebih tinggi (~10-50ms) tapi acceptable untuk chat app

### 3.3 KEPUTUSAN: Session Storage - File System dengan Backup

**Status:** APPROVED

**Options Evaluated:**

| Storage | Persistence | Performance | Complexity | Recovery |
|---------|-------------|-------------|------------|----------|
| File System | High | Fast | Low | Manual |
| Redis | Medium | Fastest | Medium | Limited |
| Database | High | Medium | High | Easy |
| File + Backup | High | Fast | Medium | Automatic |

**Decision:** File System dengan Backup Strategy (OpenClaw Pattern)

**Rationale:**
1. **Baileys Native:** `useMultiFileAuthState` designed untuk file storage
2. **Simplicity:** No additional infrastructure needed
3. **Recovery:** Backup system mencegah session loss
4. **Production Proven:** OpenClaw sudah pakai pola ini

**Implementation:**
```
storage/app/whatsapp/sessions/{account_id}/
  creds.json           # Primary credentials
  creds.backup.json    # Backup (auto-created before save)
  app-state-sync-*.json
  pre-key-*.json
  sender-key-*.json
  session-*.json
```

### 3.4 KEPUTUSAN: Baileys Version - 7.0.0-rc.9

**Status:** APPROVED

**Rationale:**
1. **Latest Stable RC:** Production-ready dengan fixes terbaru
2. **OpenClaw Tested:** Sudah divalidasi di OpenClaw extension
3. **Pairing Code Support:** Native support untuk phone number pairing
4. **Breaking Changes:** v7 ada breaking changes dari v6, better adopt sekarang

**Note:** Monitor for stable release dan upgrade setelah v7.0.0 release.

---

## 4. Detailed Component Design

### 4.1 Node.js Baileys Service

```
baileys-service/
  src/
    index.js              # Entry point, Express server
    config.js             # Configuration management
    socket/
      manager.js          # Socket lifecycle management
      factory.js          # Socket creation with best practices
      events.js           # Event handlers (connection, message)
    auth/
      session.js          # Session persistence (useMultiFileAuthState)
      backup.js           # Backup & recovery logic
      queue.js            # Credential save queue (prevent corruption)
    api/
      routes.js           # Express routes definition
      handlers/
        health.js         # /health endpoint
        auth.js           # /auth/* endpoints (QR, pairing, status)
        message.js        # /message/* endpoints (send, send-image)
    utils/
      logger.js           # Pino logger configuration
      error.js            # Error handling & formatting
      phone.js            # Phone number normalization
    middleware/
      auth.js             # API token validation
      error.js            # Global error handler
  package.json
  ecosystem.config.cjs    # PM2 configuration
```

### 4.2 Laravel Service Layer

```
app/
  Services/
    WhatsApp/
      BaileysClient.php           # HTTP client to Baileys service
      SessionManager.php          # Session status tracking
      QRLoginService.php          # QR generation orchestration
      MessageService.php          # Send message abstraction
      Contracts/
        WhatsAppClientInterface.php
      DTOs/
        ConnectionStatus.php
        QRResponse.php
        SendMessageRequest.php
        SendMessageResponse.php
      Exceptions/
        WhatsAppConnectionException.php
        WhatsAppSendException.php
        SessionExpiredException.php
  Events/
    WhatsApp/
      ConnectionEstablished.php
      ConnectionLost.php
      QRGenerated.php
      MessageReceived.php
      MessageSent.php
  Listeners/
    WhatsApp/
      LogConnectionChange.php
      NotifyAdminOnDisconnect.php
      ProcessIncomingMessage.php
  Jobs/
    WhatsApp/
      SendWhatsAppMessage.php
      ProcessWebhookPayload.php
```

### 4.3 API Endpoints Specification

#### Baileys Service API (Port 3010)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | /health | Health check | - | `{ status, connected, user }` |
| POST | /auth/qr | Request QR code | `{ account_id }` | `{ qr_data_url, expires_at }` |
| POST | /auth/pairing | Request pairing code | `{ account_id, phone }` | `{ code, expires_at }` |
| GET | /auth/status | Check auth status | `{ account_id }` | `{ authenticated, user }` |
| POST | /auth/logout | Logout & clear session | `{ account_id }` | `{ success }` |
| POST | /message/send | Send text message | `{ to, message, account_id }` | `{ messageId, timestamp }` |
| POST | /message/send-image | Send image | `{ to, image_url, caption }` | `{ messageId }` |
| POST | /message/send-buttons | Send interactive buttons | `{ to, body, buttons }` | `{ messageId }` |

#### Laravel Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /webhook/whatsapp/message | Receive incoming messages |
| POST | /webhook/whatsapp/status | Receive message status updates |
| POST | /webhook/whatsapp/connection | Receive connection status changes |

---

## 5. File Changes Summary

### 5.1 NEW FILES - Node.js Baileys Service

| File | Purpose |
|------|---------|
| `baileys-service/src/index.js` | Express server entry point |
| `baileys-service/src/config.js` | Environment configuration |
| `baileys-service/src/socket/manager.js` | Socket lifecycle management |
| `baileys-service/src/socket/factory.js` | Socket creation with OpenClaw patterns |
| `baileys-service/src/socket/events.js` | Event handlers |
| `baileys-service/src/auth/session.js` | Session persistence |
| `baileys-service/src/auth/backup.js` | Backup & recovery |
| `baileys-service/src/auth/queue.js` | Credential save queue |
| `baileys-service/src/api/routes.js` | API route definitions |
| `baileys-service/src/api/handlers/health.js` | Health endpoint |
| `baileys-service/src/api/handlers/auth.js` | Auth endpoints |
| `baileys-service/src/api/handlers/message.js` | Message endpoints |
| `baileys-service/src/utils/logger.js` | Pino logger setup |
| `baileys-service/src/utils/error.js` | Error formatting |
| `baileys-service/src/utils/phone.js` | Phone normalization |
| `baileys-service/src/middleware/auth.js` | API authentication |
| `baileys-service/src/middleware/error.js` | Error handler |
| `baileys-service/package.json` | Dependencies |
| `baileys-service/ecosystem.config.cjs` | PM2 config |

### 5.2 NEW FILES - Laravel

| File | Purpose |
|------|---------|
| `app/Services/WhatsApp/BaileysClient.php` | HTTP client |
| `app/Services/WhatsApp/SessionManager.php` | Session tracking |
| `app/Services/WhatsApp/QRLoginService.php` | QR orchestration |
| `app/Services/WhatsApp/MessageService.php` | Message abstraction |
| `app/Services/WhatsApp/Contracts/WhatsAppClientInterface.php` | Contract |
| `app/Services/WhatsApp/DTOs/ConnectionStatus.php` | DTO |
| `app/Services/WhatsApp/DTOs/QRResponse.php` | DTO |
| `app/Services/WhatsApp/DTOs/SendMessageRequest.php` | DTO |
| `app/Services/WhatsApp/DTOs/SendMessageResponse.php` | DTO |
| `app/Services/WhatsApp/Exceptions/WhatsAppConnectionException.php` | Exception |
| `app/Services/WhatsApp/Exceptions/WhatsAppSendException.php` | Exception |
| `app/Services/WhatsApp/Exceptions/SessionExpiredException.php` | Exception |
| `app/Events/WhatsApp/ConnectionEstablished.php` | Event |
| `app/Events/WhatsApp/ConnectionLost.php` | Event |
| `app/Events/WhatsApp/QRGenerated.php` | Event |
| `app/Events/WhatsApp/MessageReceived.php` | Event |
| `app/Events/WhatsApp/MessageSent.php` | Event |
| `app/Listeners/WhatsApp/LogConnectionChange.php` | Listener |
| `app/Listeners/WhatsApp/NotifyAdminOnDisconnect.php` | Listener |
| `app/Listeners/WhatsApp/ProcessIncomingMessage.php` | Listener |
| `app/Jobs/WhatsApp/SendWhatsAppMessage.php` | Queue job |
| `app/Jobs/WhatsApp/ProcessWebhookPayload.php` | Queue job |
| `config/whatsapp.php` | WhatsApp configuration |

### 5.3 MODIFIED FILES

| File | Changes |
|------|---------|
| `routes/api.php` | Add webhook routes |
| `app/Http/Controllers/WebhookController.php` | Add WhatsApp webhook handlers |
| `app/Providers/EventServiceProvider.php` | Register WhatsApp events |
| `app/Providers/AppServiceProvider.php` | Register WhatsApp services |
| `.env` | Add Baileys service configuration |
| `.env.example` | Add Baileys service configuration template |
| `package.json` | Add baileys-service workspace (optional) |
| `.gitignore` | Add session directories |

### 5.4 DEPRECATED FILES (to be removed after migration)

| File | Reason |
|------|--------|
| `bot/wa_client.py` | Replaced by BaileysClient.php |
| `bot/handlers.py` | Logic moved to Laravel listeners |

---

## 6. Configuration

### 6.1 Environment Variables

```env
# Baileys Service Configuration
BAILEYS_SERVICE_URL=http://127.0.0.1:3010
BAILEYS_SERVICE_TOKEN=your-secure-api-token
BAILEYS_SESSION_DIR=storage/app/whatsapp/sessions
BAILEYS_QR_TIMEOUT_MS=60000
BAILEYS_RECONNECT_ATTEMPTS=5
BAILEYS_RECONNECT_DELAY_MS=5000

# Webhook Configuration
BAILEYS_WEBHOOK_URL=http://127.0.0.1:8000/webhook/whatsapp
BAILEYS_WEBHOOK_SECRET=your-webhook-secret

# Feature Flags
BAILEYS_SEND_READ_RECEIPTS=true
BAILEYS_MARK_ONLINE=false
BAILEYS_SYNC_HISTORY=false
```

### 6.2 Laravel Config (config/whatsapp.php)

```php
<?php

return [
    'baileys' => [
        'service_url' => env('BAILEYS_SERVICE_URL', 'http://127.0.0.1:3010'),
        'service_token' => env('BAILEYS_SERVICE_TOKEN'),
        'session_dir' => env('BAILEYS_SESSION_DIR', storage_path('app/whatsapp/sessions')),
        'qr_timeout_ms' => (int) env('BAILEYS_QR_TIMEOUT_MS', 60000),
        'reconnect_attempts' => (int) env('BAILEYS_RECONNECT_ATTEMPTS', 5),
        'reconnect_delay_ms' => (int) env('BAILEYS_RECONNECT_DELAY_MS', 5000),
    ],

    'webhook' => [
        'url' => env('BAILEYS_WEBHOOK_URL', 'http://127.0.0.1:8000/webhook/whatsapp'),
        'secret' => env('BAILEYS_WEBHOOK_SECRET'),
    ],

    'features' => [
        'send_read_receipts' => env('BAILEYS_SEND_READ_RECEIPTS', true),
        'mark_online' => env('BAILEYS_MARK_ONLINE', false),
        'sync_history' => env('BAILEYS_SYNC_HISTORY', false),
    ],
];
```

---

## 7. Security Considerations

### 7.1 Credential Protection

1. **File Permissions:** Session files dengan chmod 0600
2. **Directory Isolation:** Per-account session directories
3. **Backup Encryption:** Consider encrypting backup files
4. **Access Control:** API token untuk inter-service communication

### 7.2 API Security

1. **Token Authentication:** Bearer token untuk Baileys service API
2. **Webhook Signature:** HMAC signature untuk webhook verification
3. **Rate Limiting:** Prevent abuse pada send endpoints
4. **Input Validation:** Sanitize phone numbers dan message content

### 7.3 Session Security

1. **No Credential Logging:** Never log creds.json content
2. **Secure Transmission:** HTTPS untuk production
3. **Session Expiry:** Monitor dan alert untuk expired sessions

---

## 8. Monitoring & Observability

### 8.1 Health Checks

- **Baileys Service:** `/health` endpoint dengan connection status
- **Laravel:** Service health via `BaileysClient::isHealthy()`
- **PM2:** Process monitoring dengan auto-restart

### 8.2 Logging

```
Level: INFO
- Connection established/closed
- Message sent/received counts
- Session save events

Level: WARN
- Reconnection attempts
- Rate limiting triggered
- Credential save failures

Level: ERROR
- Connection failures
- Message send failures
- Session corruption detected
```

### 8.3 Metrics (Future)

- Connection uptime percentage
- Message delivery rate
- Average response time
- QR generation to connection time

---

## 9. Deployment Architecture

### 9.1 PM2 Ecosystem

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'baileys-service',
      script: './src/index.js',
      cwd: './baileys-service',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
    },
  ],
};
```

### 9.2 Supervisor Configuration (Alternative)

```ini
[program:baileys-service]
command=node /var/www/whatsapp-sla/baileys-service/src/index.js
directory=/var/www/whatsapp-sla/baileys-service
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/baileys-service.err.log
stdout_logfile=/var/log/baileys-service.out.log
```

---

## 10. Migration Plan

### Phase 1: Infrastructure Setup
1. Create baileys-service directory structure
2. Install dependencies (@whiskeysockets/baileys@7.0.0-rc.9)
3. Implement core socket management
4. Implement session persistence with backup

### Phase 2: API Development
1. Implement health endpoint
2. Implement auth endpoints (QR, pairing, status)
3. Implement message endpoints
4. Add authentication middleware

### Phase 3: Laravel Integration
1. Create WhatsApp service layer
2. Create DTOs and exceptions
3. Implement BaileysClient
4. Create events and listeners

### Phase 4: Webhook Integration
1. Add webhook routes
2. Implement webhook handlers
3. Add webhook signature verification

### Phase 5: Testing & Validation
1. Unit tests untuk services
2. Integration tests untuk API
3. End-to-end tests untuk full flow

### Phase 6: Migration Cutover
1. Deploy baileys-service ke PM2
2. Update Laravel configuration
3. Deprecate Python bot
4. Monitor dan validate

---

## 11. Appendix

### A. Reference Implementations

- **OpenClaw WhatsApp Extension:** Enterprise-grade patterns
- **TAM Store Bot:** Production-running Baileys implementation
- **Baileys Documentation:** https://github.com/WhiskeySockets/Baileys

### B. Error Codes

| Code | Description | Recovery Action |
|------|-------------|-----------------|
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden | Check permissions |
| 408 | Request Timeout | Retry with backoff |
| 428 | Connection Required | Reconnect socket |
| 440 | Logged Out | Re-authenticate |
| 500 | Server Error | Check logs, restart |
| 515 | Restart Required | Automatic restart |

### C. Baileys Version Compatibility

| Baileys Version | Status | Notes |
|-----------------|--------|-------|
| 6.7.8 | Stable | Current tam-store-bot |
| 7.0.0-rc.9 | RC | OpenClaw recommended |
| 7.0.0 | Pending | Wait for stable release |

---

*Document generated by Architecture Agent*
*Last updated: 2026-03-26*
