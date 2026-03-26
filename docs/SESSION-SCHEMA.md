# Session Schema Design - WhatsApp Baileys Auth

## 1. Executive Summary

Dokumen ini mendefinisikan strategi penyimpanan session authentication untuk integrasi WhatsApp menggunakan library `@whiskeysockets/baileys`. Session menyimpan kredensial kriptografis yang memungkinkan aplikasi terhubung ke WhatsApp tanpa perlu scan QR code berulang kali.

**Key Decisions:**
- **Primary Storage**: Multi-file auth state (file-based) sesuai pattern Baileys
- **Backup/Cache**: Redis untuk fast recovery dan health check state
- **Encryption**: Opsional AES-256-GCM untuk at-rest encryption
- **Location**: `storage/app/whatsapp-sessions/{phone_number}/`

---

## 2. Session Storage Strategy

### 2.1 Primary: Multi-File Auth State

Menggunakan pattern `useMultiFileAuthState` dari Baileys yang sudah teruji dan stabil. Setiap session disimpan dalam folder terpisah berdasarkan nomor telepon.

**Keuntungan Multi-File vs Single-File:**

| Aspek | Multi-File | Single-File |
|-------|-----------|-------------|
| Concurrent Write | Safe (file-level lock) | Race condition risk |
| Partial Recovery | Possible | All-or-nothing |
| I/O Performance | Better (targeted reads) | Full file load setiap akses |
| Debugging | Mudah inspect per-key | Sulit trace masalah |
| File Size | Distributed (~100KB total) | Single large file |

### 2.2 Backup: Redis Cache (Opsional)

```
REDIS_SESSION_PREFIX=whatsapp_session:
REDIS_SESSION_TTL=86400  # 24 jam
```

Redis digunakan untuk:
- Fast health check tanpa baca file
- Session state flag (connected/disconnected)
- Last activity timestamp
- Quick recovery metadata

**Bukan untuk:** Menyimpan credential utama (terlalu besar dan sensitif).

### 2.3 Encryption at Rest

```typescript
// Konfigurasi enkripsi (opsional, default: OFF untuk development)
const ENCRYPTION_ENABLED = process.env.SESSION_ENCRYPTION === 'true';
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY; // 32 bytes hex
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
```

**Kapan diaktifkan:**
- Production environment
- Shared hosting / multi-tenant
- Compliance requirement

**Kapan tidak perlu:**
- Development / local
- Single-tenant dedicated server
- Performance-critical dengan backup lain

---

## 3. Session Schema

### 3.1 AuthenticationCreds (creds.json)

```typescript
interface AuthenticationCreds {
  // === Signal Protocol Keys ===
  noiseKey: KeyPair;              // Noise protocol key pair
  pairingEphemeralKeyPair: KeyPair; // Ephemeral key untuk pairing
  signedIdentityKey: KeyPair;     // Identity key (long-term)
  signedPreKey: SignedKeyPair;    // Signed pre-key untuk E2E
  registrationId: number;         // Unique registration identifier

  // === Account Info ===
  me?: Contact;                   // Info user: id, name, imgUrl
  account?: ADVSignedDeviceIdentity; // Device identity dari WA
  advSecretKey: string;           // ADV secret key (base64)

  // === Device Registration ===
  deviceId: string;               // Device UUID (base64url)
  phoneId: string;                // Phone UUID
  identityId: Buffer;             // Identity bytes (20 bytes)
  registered: boolean;            // Apakah sudah registered?
  backupToken: Buffer;            // Backup token (20 bytes)
  registration: RegistrationOptions; // Registration details

  // === Pre-Key Management ===
  firstUnuploadedPreKeyId: number;
  nextPreKeyId: number;

  // === Sync State ===
  myAppStateKeyId?: string;
  lastAccountSyncTimestamp?: number;
  processedHistoryMessages: MinimalMessage[];
  accountSyncCounter: number;

  // === Settings ===
  accountSettings: {
    unarchiveChats: boolean;
    defaultDisappearingMode?: {
      ephemeralExpiration: number;
      ephemeralSettingTimestamp: number;
    };
  };

  // === Pairing ===
  pairingCode?: string;           // 8-digit pairing code
  lastPropHash?: string;
  routingInfo?: Buffer;
  platform?: string;
  signalIdentities?: SignalIdentity[];
}

interface KeyPair {
  public: Uint8Array;   // 32 bytes
  private: Uint8Array;  // 32 bytes
}

interface SignedKeyPair {
  keyPair: KeyPair;
  signature: Uint8Array; // 64 bytes
  keyId: number;
  timestampS?: number;
}
```

### 3.2 SignalKeyStore (keys/)

```typescript
interface SignalKeyStore {
  get<T extends keyof SignalDataTypeMap>(
    type: T,
    ids: string[]
  ): Promise<{ [id: string]: SignalDataTypeMap[T] }>;

  set(data: SignalDataSet): Promise<void>;
  clear?(): Promise<void>;
}

type SignalDataTypeMap = {
  'pre-key': KeyPair;                    // Pre-keys untuk E2E setup
  'session': Uint8Array;                 // Session dengan peer
  'sender-key': Uint8Array;              // Group message keys
  'sender-key-memory': { [jid: string]: boolean };
  'app-state-sync-key': AppStateSyncKeyData;
  'app-state-sync-version': LTHashState;
};

interface LTHashState {
  version: number;
  hash: Buffer;
  indexValueMap: {
    [indexMacBase64: string]: {
      valueMac: Uint8Array | Buffer;
    };
  };
}
```

---

## 4. File Structure

### 4.1 Directory Layout

```
storage/app/whatsapp-sessions/
└── 6281234567890/                    # Phone number (tanpa +)
    ├── creds.json                    # Main credentials (~5KB)
    ├── pre-key-1.json                # Pre-key #1
    ├── pre-key-2.json                # Pre-key #2
    ├── ...                           # Pre-keys (bisa 100+ files)
    ├── session-6287654321-0.json     # Session dengan peer
    ├── session-6289999999-1.json     # Session dengan peer device 1
    ├── sender-key-...json            # Group sender keys
    ├── app-state-sync-key-...json    # App state sync keys
    └── app-state-sync-version-...json # Sync version states
```

### 4.2 File Naming Convention

```typescript
// useMultiFileAuthState mengganti karakter khusus:
function fixFileName(file: string): string {
  return file
    ?.replace(/\//g, '__')  // Slash → double underscore
    ?.replace(/:/g, '-');   // Colon → dash
}

// Contoh transformasi:
// "session-6281234567890:0" → "session-6281234567890-0.json"
// "app-state-sync-key-AAAA/BBBB" → "app-state-sync-key-AAAA__BBBB.json"
```

### 4.3 Typical File Sizes

| File Type | Count | Size per File | Total Estimated |
|-----------|-------|---------------|-----------------|
| creds.json | 1 | 3-5 KB | 5 KB |
| pre-key-*.json | 50-200 | 200 bytes | 10-40 KB |
| session-*.json | 10-100 | 500-2000 bytes | 5-200 KB |
| sender-key-*.json | 0-500 | 300 bytes | 0-150 KB |
| app-state-*.json | 5-20 | 1-5 KB | 5-100 KB |

**Total per session: 25 KB - 500 KB** (tergantung aktivitas)

---

## 5. Session Lifecycle

### 5.1 State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐    QR/Pairing     ┌────────────────┐           │
│  │  CREATED   │ ───────────────→  │  AUTHENTICATING │           │
│  │ (no creds) │                   │  (creds.registered=false)   │
│  └────────────┘                   └────────────────┘           │
│        │                                  │                     │
│        │                                  │ Success             │
│        │                                  ▼                     │
│        │                          ┌────────────────┐           │
│        │                          │    CONNECTED    │           │
│        │                          │ (creds.registered=true)     │
│        │                          │ (connection='open')         │
│        │                          └────────────────┘           │
│        │                                  │                     │
│        │                    ┌─────────────┼─────────────┐       │
│        │                    │             │             │       │
│        │                    ▼             ▼             ▼       │
│        │            ┌────────────┐ ┌──────────┐ ┌───────────┐  │
│        │            │ RECONNECTING│ │DISCONNECTED│ │ LOGGED_OUT│  │
│        │            │ (auto retry)│ │ (manual)  │ │ (banned)  │  │
│        │            └────────────┘ └──────────┘ └───────────┘  │
│        │                    │             │             │       │
│        │                    │             │             │       │
│        │                    ▼             │             ▼       │
│        │            ┌────────────────┐    │     ┌────────────┐ │
│        │            │   CONNECTED    │◄───┘     │ INVALIDATED│ │
│        │            └────────────────┘          │ (delete)   │ │
│        │                                        └────────────┘ │
│        │                                               │       │
│        └───────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Lifecycle Events

#### 5.2.1 Creation (First Login)

```typescript
// Trigger: User memulai proses pairing
async function createSession(phoneNumber: string): Promise<void> {
  const sessionPath = `storage/app/whatsapp-sessions/${phoneNumber}`;

  // 1. Create directory
  await fs.mkdir(sessionPath, { recursive: true });

  // 2. Initialize auth state
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  // 3. Create socket
  const sock = makeWASocket({
    auth: state,
    browser: ['WhatsApp SLA', 'Chrome', '120.0.0'],
  });

  // 4. Handle pairing
  if (!state.creds.registered) {
    const code = await sock.requestPairingCode(phoneNumber);
    // Display code to user
  }

  // 5. Save on creds update
  sock.ev.on('creds.update', saveCreds);
}
```

**Files Created:**
- `creds.json` - Initial credentials (registered=false)

#### 5.2.2 Update (Credential Refresh)

```typescript
// Trigger: creds.update event
// Frekuensi: Setiap ada message sent/received (key rotation)

sock.ev.on('creds.update', async () => {
  await saveCreds(); // Atomic write dengan file lock

  // Update Redis health check
  await redis.hset(`whatsapp_session:${phoneNumber}`, {
    lastActivity: Date.now(),
    status: 'connected'
  });
});
```

**Files Updated:**
- `creds.json` - Updated credentials
- `pre-key-*.json` - New pre-keys generated
- `session-*.json` - Session state updates
- `sender-key-*.json` - Group key updates
- `app-state-sync-*.json` - Sync state updates

#### 5.2.3 Restore (Service Restart)

```typescript
// Trigger: Service restart / PM2 reload
async function restoreSession(phoneNumber: string): Promise<WASocket | null> {
  const sessionPath = `storage/app/whatsapp-sessions/${phoneNumber}`;

  // 1. Check session exists
  if (!await fs.access(`${sessionPath}/creds.json`).then(() => true).catch(() => false)) {
    return null; // No session to restore
  }

  // 2. Load auth state
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  // 3. Verify registered
  if (!state.creds.registered) {
    console.warn(`Session ${phoneNumber} exists but not registered`);
    return null;
  }

  // 4. Create socket and reconnect
  const sock = makeWASocket({
    auth: state,
    browser: ['WhatsApp SLA', 'Chrome', '120.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  return sock;
}
```

#### 5.2.4 Invalidation (Logout/Ban)

```typescript
// Trigger: DisconnectReason.loggedOut (statusCode: 401, 403, 440)
async function invalidateSession(phoneNumber: string, reason: string): Promise<void> {
  const sessionPath = `storage/app/whatsapp-sessions/${phoneNumber}`;

  // 1. Archive session (optional, untuk debugging)
  const archivePath = `storage/app/whatsapp-sessions-archive/${phoneNumber}-${Date.now()}`;
  await fs.rename(sessionPath, archivePath);

  // 2. Clear Redis state
  await redis.del(`whatsapp_session:${phoneNumber}`);

  // 3. Log invalidation
  await logSessionEvent(phoneNumber, 'invalidated', {
    reason,
    archivedTo: archivePath
  });

  // 4. Notify admin
  await notifyAdmin(`Session ${phoneNumber} invalidated: ${reason}`);
}
```

**Disconnect Reasons yang Invalidate Session:**
| Code | Reason | Action |
|------|--------|--------|
| 401 | Unauthorized | Delete session |
| 403 | Forbidden | Delete session |
| 440 | Logged Out | Delete session |
| 408 | Connection timed out | Retry |
| 428 | Too many requests | Retry with backoff |
| 500-599 | Server error | Retry |
| 515 | Restart required | Restart socket |

---

## 6. Security Considerations

### 6.1 File Permissions

```bash
# Session directory permissions
chmod 700 storage/app/whatsapp-sessions/
chmod 600 storage/app/whatsapp-sessions/*/*.json

# Owner should be web server user
chown -R www-data:www-data storage/app/whatsapp-sessions/
```

### 6.2 Gitignore (MANDATORY)

```gitignore
# WhatsApp Baileys Sessions - NEVER COMMIT!
storage/app/whatsapp-sessions/
**/creds.json
**/pre-key*.json
**/sender-key*.json
**/app-state*.json
**/session-*.json
```

### 6.3 Encryption Implementation (Optional)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.SESSION_ENCRYPTION_KEY!, 'hex');

function encrypt(data: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted
  });
}

function decrypt(encrypted: string): string {
  const { iv, authTag, data } = JSON.parse(encrypted);

  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 6.4 Backup Strategy

```typescript
// Automated backup setiap 6 jam
async function backupSession(phoneNumber: string): Promise<void> {
  const sessionPath = `storage/app/whatsapp-sessions/${phoneNumber}`;
  const backupPath = `storage/app/whatsapp-backups/${phoneNumber}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Compress session folder
  await exec(`tar -czf ${backupPath}/${timestamp}.tar.gz -C ${sessionPath} .`);

  // Keep only last 5 backups
  const backups = await fs.readdir(backupPath);
  if (backups.length > 5) {
    const toDelete = backups.slice(0, backups.length - 5);
    for (const file of toDelete) {
      await fs.unlink(`${backupPath}/${file}`);
    }
  }
}
```

---

## 7. TypeScript Interface Definitions

```typescript
// types/baileys-session.ts

export interface SessionConfig {
  phoneNumber: string;
  sessionPath: string;
  encryptionEnabled: boolean;
  redisEnabled: boolean;
}

export interface SessionStatus {
  phoneNumber: string;
  registered: boolean;
  connected: boolean;
  lastActivity: Date | null;
  createdAt: Date;
  fileCount: number;
  totalSizeKB: number;
}

export interface SessionHealthCheck {
  phoneNumber: string;
  healthy: boolean;
  credsExists: boolean;
  credsValid: boolean;
  canReconnect: boolean;
  lastError?: string;
}

export interface SessionEvent {
  type: 'created' | 'connected' | 'disconnected' | 'updated' | 'invalidated';
  phoneNumber: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

// Service interface
export interface ISessionManager {
  create(phoneNumber: string): Promise<SessionStatus>;
  restore(phoneNumber: string): Promise<boolean>;
  getStatus(phoneNumber: string): Promise<SessionStatus | null>;
  healthCheck(phoneNumber: string): Promise<SessionHealthCheck>;
  invalidate(phoneNumber: string, reason: string): Promise<void>;
  backup(phoneNumber: string): Promise<string>;
  listAll(): Promise<SessionStatus[]>;
}
```

---

## 8. Redis Schema (Optional Cache Layer)

```typescript
// Redis key structure
const REDIS_KEYS = {
  // Session metadata
  sessionMeta: (phone: string) => `whatsapp:session:${phone}:meta`,
  // Connection status
  sessionStatus: (phone: string) => `whatsapp:session:${phone}:status`,
  // All active sessions set
  activeSessions: 'whatsapp:sessions:active',
  // Session lock (untuk prevent concurrent operations)
  sessionLock: (phone: string) => `whatsapp:session:${phone}:lock`,
};

// Redis data structures
interface RedisSessionMeta {
  phoneNumber: string;
  createdAt: string;        // ISO timestamp
  lastActivity: string;     // ISO timestamp
  deviceName: string;
  userName: string;
}

interface RedisSessionStatus {
  connected: boolean;
  lastDisconnectReason?: number;
  lastConnectedAt?: string;
  reconnectAttempts: number;
}

// Redis operations
async function updateSessionStatus(phone: string, status: Partial<RedisSessionStatus>) {
  await redis.hset(REDIS_KEYS.sessionStatus(phone), status);
  await redis.sadd(REDIS_KEYS.activeSessions, phone);
  await redis.expire(REDIS_KEYS.sessionStatus(phone), 86400); // 24h TTL
}

async function getActiveSessions(): Promise<string[]> {
  return redis.smembers(REDIS_KEYS.activeSessions);
}
```

---

## 9. Implementation Checklist

### Phase 1: Basic Implementation
- [ ] Setup session directory structure
- [ ] Implement useMultiFileAuthState wrapper
- [ ] Add session creation flow (QR + Pairing Code)
- [ ] Implement session restore on startup
- [ ] Handle creds.update event properly

### Phase 2: Reliability
- [ ] Add file locking (async-lock)
- [ ] Implement connection retry logic
- [ ] Add session health check endpoint
- [ ] Setup automated backup
- [ ] Add session invalidation flow

### Phase 3: Security (Production)
- [ ] Implement encryption at rest
- [ ] Add Redis cache layer
- [ ] Setup file permission automation
- [ ] Add audit logging
- [ ] Implement session rotation policy

### Phase 4: Monitoring
- [ ] Add session metrics (Prometheus)
- [ ] Setup alerts for session failures
- [ ] Create admin dashboard for session management
- [ ] Implement session expiry notifications

---

## 10. Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [CONTRACT.md](./CONTRACT.md) - API contracts
- [RETRY-POLICY.md](./RETRY-POLICY.md) - Reconnection strategies
- [LIFECYCLE.md](./LIFECYCLE.md) - Session lifecycle details

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-26 | Session Schema Agent | Initial design document |
