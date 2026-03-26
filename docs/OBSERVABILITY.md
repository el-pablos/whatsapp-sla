# Observability Design - Baileys WhatsApp Authentication

> **Version**: 1.0.0
> **Last Updated**: 2026-03-26
> **Author**: Observability Agent
> **Status**: Design Phase

## Table of Contents

1. [Overview](#1-overview)
2. [Logging Strategy](#2-logging-strategy)
3. [Mandatory Log Events](#3-mandatory-log-events)
4. [Metrics Collection](#4-metrics-collection)
5. [Alerting Rules](#5-alerting-rules)
6. [Dashboard Requirements](#6-dashboard-requirements)
7. [Implementation Guide](#7-implementation-guide)
8. [Data Retention Policy](#8-data-retention-policy)

---

## 1. Overview

### 1.1 Three Pillars of Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│      LOGS       │     METRICS     │          TRACES             │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ Structured JSON │ Prometheus      │ Request/Session Correlation │
│ Centralized     │ Time-series     │ Distributed Context         │
│ Searchable      │ Aggregatable    │ End-to-end visibility       │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 1.2 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Baileys   │  │   Laravel   │  │    Queue    │  │   Webhook   │  │
│  │   Service   │  │     API     │  │   Workers   │  │   Handler   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │                │          │
│         └────────────────┴────────────────┴────────────────┘          │
│                                   │                                   │
│                          ┌────────▼────────┐                         │
│                          │  Logger Service  │                         │
│                          │   (Unified API)  │                         │
│                          └────────┬────────┘                         │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │   File    │   │  Stdout   │   │   Redis   │
            │  (JSON)   │   │  (Stream) │   │  (Queue)  │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  └───────────────┼───────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │    Log Aggregation      │
                    │  (Loki / ELK / File)    │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌───────────────┐       ┌───────────────┐
            │    Grafana    │       │   Alerting    │
            │  (Dashboard)  │       │  (Slack/TG)   │
            └───────────────┘       └───────────────┘
```

### 1.3 Design Principles

| Principle | Description |
|-----------|-------------|
| **Structured First** | All logs MUST be JSON formatted for parseability |
| **Security by Design** | Sensitive data MUST be masked before logging |
| **Correlation Ready** | Every event MUST include trace/session ID |
| **Performance Aware** | Logging MUST NOT impact application performance |
| **Retention Compliant** | Data retention follows compliance requirements |

---

## 2. Logging Strategy

### 2.1 Log Levels Definition

| Level | Code | Usage | Example |
|-------|------|-------|---------|
| **ERROR** | 3 | Runtime errors requiring attention | Auth failure, connection lost |
| **WARN** | 4 | Abnormal but recoverable conditions | Reconnection attempt, rate limit |
| **INFO** | 6 | Significant business events | Auth success, QR scanned |
| **DEBUG** | 7 | Detailed diagnostic info | Message sent, socket event |

### 2.2 Structured JSON Format

#### Base Log Schema

```typescript
interface LogEntry {
  // Required fields
  timestamp: string;       // ISO 8601 format: 2026-03-26T10:30:00.000Z
  level: 'error' | 'warn' | 'info' | 'debug';
  event: string;           // Event identifier: auth:success, connection:open
  message: string;         // Human-readable description

  // Context fields
  context: {
    session_id: string;    // Unique session identifier
    trace_id?: string;     // Distributed trace ID
    span_id?: string;      // Span ID for sub-operations
  };

  // Service identification
  service: {
    name: 'baileys-auth';
    version: string;
    environment: 'development' | 'staging' | 'production';
    instance_id: string;   // Container/process identifier
  };

  // Event-specific data
  data?: Record<string, unknown>;

  // Error details (when level = error)
  error?: {
    code: string;
    message: string;
    stack?: string;
  };

  // Performance metrics
  duration_ms?: number;
  memory_mb?: number;
}
```

#### Example Log Entries

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "level": "info",
  "event": "auth:success",
  "message": "WhatsApp authentication successful",
  "context": {
    "session_id": "sess_abc123",
    "trace_id": "trace_xyz789"
  },
  "service": {
    "name": "baileys-auth",
    "version": "1.0.0",
    "environment": "production",
    "instance_id": "node-1"
  },
  "data": {
    "jid": "6281****5678@s.whatsapp.net",
    "auth_method": "qr_code",
    "auth_duration_ms": 15234
  },
  "duration_ms": 15234
}
```

```json
{
  "timestamp": "2026-03-26T10:35:00.000Z",
  "level": "error",
  "event": "auth:failure",
  "message": "WhatsApp authentication failed",
  "context": {
    "session_id": "sess_def456",
    "trace_id": "trace_uvw123"
  },
  "service": {
    "name": "baileys-auth",
    "version": "1.0.0",
    "environment": "production",
    "instance_id": "node-1"
  },
  "data": {
    "attempt_number": 3,
    "qr_generated_count": 5
  },
  "error": {
    "code": "AUTH_TIMEOUT",
    "message": "QR code scan timeout after 5 attempts",
    "stack": "Error: QR code scan timeout..."
  },
  "duration_ms": 300000
}
```

### 2.3 Sensitive Data Masking

#### Masking Rules

| Data Type | Original | Masked | Rule |
|-----------|----------|--------|------|
| Phone Number | 6281234567890 | 6281****7890 | Show first 4, last 4 |
| JID | 6281234567890@s.whatsapp.net | 6281****7890@s.whatsapp.net | Mask phone part |
| Access Token | abc123xyz789 | abc1****9 | Show first 4, last 1 |
| Session Path | /app/sessions/sess_abc123 | /app/sessions/sess_*** | Truncate session ID |
| QR Code Data | base64... | [QR_DATA_REDACTED] | Fully redacted |
| Auth Creds | {"noiseKey":...} | [AUTH_CREDS_REDACTED] | Fully redacted |

#### Masking Implementation

```typescript
// lib/masking.ts
export const MaskingRules = {
  phoneNumber: (value: string): string => {
    if (!value || value.length < 8) return '[INVALID_PHONE]';
    return value.slice(0, 4) + '****' + value.slice(-4);
  },

  jid: (value: string): string => {
    const [phone, domain] = value.split('@');
    if (!phone) return '[INVALID_JID]';
    return MaskingRules.phoneNumber(phone) + '@' + (domain || 's.whatsapp.net');
  },

  token: (value: string): string => {
    if (!value || value.length < 8) return '[REDACTED]';
    return value.slice(0, 4) + '****' + value.slice(-1);
  },

  sessionPath: (value: string): string => {
    return value.replace(/sess_[a-zA-Z0-9]+/g, 'sess_***');
  },

  qrCode: (_value: string): string => '[QR_DATA_REDACTED]',

  authCreds: (_value: unknown): string => '[AUTH_CREDS_REDACTED]',
};

// Automatic field detection and masking
export const sensitiveFields = [
  'password', 'token', 'secret', 'key', 'credential',
  'qr', 'qrcode', 'auth_state', 'noise_key', 'signed_identity_key'
];
```

### 2.4 Log Output Targets

#### Multi-Channel Output Configuration

```typescript
// config/logging.ts
export const LoggingConfig = {
  channels: {
    // Primary: File-based JSON logs
    file: {
      enabled: true,
      path: 'storage/logs/baileys',
      filename: 'baileys-{date}.log',
      maxSize: '100m',
      maxFiles: 30,
      compress: true,
    },

    // Secondary: Stdout for container environments
    stdout: {
      enabled: process.env.LOG_STDOUT === 'true',
      format: 'json', // or 'pretty' for development
    },

    // Tertiary: Redis for real-time streaming
    redis: {
      enabled: process.env.LOG_REDIS === 'true',
      stream: 'logs:baileys',
      maxLen: 10000,
    },

    // Error-specific: Separate error log
    error: {
      enabled: true,
      path: 'storage/logs/baileys',
      filename: 'baileys-error-{date}.log',
      level: 'error',
      maxSize: '50m',
      maxFiles: 90,
    },
  },

  // Level per environment
  level: {
    development: 'debug',
    staging: 'info',
    production: 'info',
  },

  // Sampling for high-volume events
  sampling: {
    'message:sent': 0.1,     // Log 10% of message:sent
    'message:received': 0.1, // Log 10% of message:received
    'heartbeat': 0.01,       // Log 1% of heartbeats
  },
};
```

### 2.5 Log Rotation Policy

| Environment | Rotation | Retention | Compression |
|-------------|----------|-----------|-------------|
| Development | Daily | 7 days | No |
| Staging | Daily | 14 days | Yes (gzip) |
| Production | Daily | 30 days | Yes (gzip) |
| Error Logs | Daily | 90 days | Yes (gzip) |
| Audit Logs | Daily | 365 days | Yes (gzip) |

---

## 3. Mandatory Log Events

### 3.1 Authentication Events

| Event | Level | Description | Data Fields |
|-------|-------|-------------|-------------|
| `auth:start` | INFO | Auth process initiated | session_id, method |
| `auth:qr_generated` | INFO | QR code generated | qr_number, expires_at |
| `auth:qr_scanned` | INFO | QR code scanned by user | - |
| `auth:pairing_code` | INFO | Pairing code generated | code_masked |
| `auth:success` | INFO | Auth completed successfully | jid_masked, auth_duration_ms |
| `auth:failure` | ERROR | Auth failed | error_code, reason, attempts |
| `auth:logout` | INFO | Session logged out | reason |
| `auth:session_restored` | INFO | Session restored from storage | session_age_hours |

#### Event Schemas

```typescript
// auth:start
{
  event: 'auth:start',
  level: 'info',
  message: 'WhatsApp authentication started',
  data: {
    session_id: 'sess_abc123',
    auth_method: 'qr_code' | 'pairing_code',
    retry_count: 0,
  }
}

// auth:qr_generated
{
  event: 'auth:qr_generated',
  level: 'info',
  message: 'QR code generated for scanning',
  data: {
    qr_number: 1,          // 1st, 2nd, 3rd QR
    max_qr_attempts: 5,
    expires_at: '2026-03-26T10:32:00.000Z',
    ttl_seconds: 120,
  }
}

// auth:success
{
  event: 'auth:success',
  level: 'info',
  message: 'WhatsApp authentication successful',
  data: {
    jid: '6281****5678@s.whatsapp.net',  // MASKED
    auth_method: 'qr_code',
    auth_duration_ms: 15234,
    qr_attempts: 2,
    platform: 'android',
    wa_version: '2.24.5.78',
  }
}

// auth:failure
{
  event: 'auth:failure',
  level: 'error',
  message: 'WhatsApp authentication failed',
  data: {
    attempt_number: 3,
    qr_generated_count: 5,
    total_duration_ms: 300000,
  },
  error: {
    code: 'AUTH_TIMEOUT' | 'CONNECTION_FAILED' | 'INVALID_SESSION' | 'BANNED',
    message: 'Human-readable error description',
    stack: 'Error stack trace...',
  }
}
```

### 3.2 Connection Events

| Event | Level | Description | Data Fields |
|-------|-------|-------------|-------------|
| `connection:open` | INFO | WebSocket connected | endpoint |
| `connection:close` | WARN | Connection closed | code, reason, wasClean |
| `connection:reconnecting` | WARN | Attempting reconnection | attempt, delay_ms |
| `connection:reconnected` | INFO | Reconnection successful | attempt, downtime_ms |
| `connection:failed` | ERROR | Connection permanently failed | error_code, attempts |

#### Event Schemas

```typescript
// connection:open
{
  event: 'connection:open',
  level: 'info',
  message: 'WebSocket connection established',
  data: {
    endpoint: 'wss://web.whatsapp.com/ws/chat',
    connection_time_ms: 1234,
    protocol: 'noise',
  }
}

// connection:close
{
  event: 'connection:close',
  level: 'warn',
  message: 'WebSocket connection closed',
  data: {
    code: 1006,
    reason: 'Connection lost',
    was_clean: false,
    uptime_seconds: 3600,
  }
}

// connection:reconnecting
{
  event: 'connection:reconnecting',
  level: 'warn',
  message: 'Attempting to reconnect',
  data: {
    attempt: 3,
    max_attempts: 10,
    delay_ms: 5000,
    strategy: 'exponential_backoff',
    total_downtime_ms: 15000,
  }
}
```

### 3.3 Message Events

| Event | Level | Description | Data Fields |
|-------|-------|-------------|-------------|
| `message:sent` | DEBUG | Message sent successfully | to_masked, msg_id, type |
| `message:received` | DEBUG | Message received | from_masked, msg_id, type |
| `message:failed` | ERROR | Message send failed | to_masked, error |
| `message:ack` | DEBUG | Message acknowledged | msg_id, ack_level |

#### Event Schemas

```typescript
// message:sent
{
  event: 'message:sent',
  level: 'debug',
  message: 'Message sent successfully',
  data: {
    to: '6281****5678@s.whatsapp.net',  // MASKED
    msg_id: '3EB0ABC123...',
    type: 'text' | 'image' | 'document' | 'template',
    content_length: 256,
    latency_ms: 234,
  }
}

// message:received
{
  event: 'message:received',
  level: 'debug',
  message: 'Message received',
  data: {
    from: '6281****5678@s.whatsapp.net',  // MASKED
    msg_id: '3EB0XYZ789...',
    type: 'text' | 'image' | 'document',
    is_group: false,
    timestamp: '2026-03-26T10:30:00.000Z',
  }
}
```

### 3.4 Session Events

| Event | Level | Description | Data Fields |
|-------|-------|-------------|-------------|
| `session:created` | INFO | New session created | session_id |
| `session:loaded` | INFO | Session loaded from storage | session_id, age_hours |
| `session:saved` | DEBUG | Session persisted | session_id, size_bytes |
| `session:expired` | WARN | Session expired | session_id, reason |
| `session:corrupted` | ERROR | Session data corrupted | session_id, error |

### 3.5 Error Events

| Event | Level | Description | Data Fields |
|-------|-------|-------------|-------------|
| `error:unhandled` | ERROR | Unhandled exception | stack, context |
| `error:rate_limit` | WARN | Rate limited by WhatsApp | retry_after_ms |
| `error:banned` | ERROR | Account banned | reason |
| `error:storage` | ERROR | Storage operation failed | operation, path |

---

## 4. Metrics Collection

### 4.1 Counter Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `baileys_auth_total` | Counter | status, method | Total auth attempts |
| `baileys_auth_success_total` | Counter | method | Successful auths |
| `baileys_auth_failure_total` | Counter | error_code | Failed auths |
| `baileys_reconnect_total` | Counter | reason | Reconnection attempts |
| `baileys_message_sent_total` | Counter | type, status | Messages sent |
| `baileys_message_received_total` | Counter | type | Messages received |
| `baileys_qr_generated_total` | Counter | - | QR codes generated |
| `baileys_session_created_total` | Counter | - | Sessions created |

### 4.2 Gauge Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `baileys_connection_status` | Gauge | - | 1=connected, 0=disconnected |
| `baileys_active_sessions` | Gauge | - | Currently active sessions |
| `baileys_session_age_seconds` | Gauge | session_id | Age of current session |
| `baileys_connection_uptime_seconds` | Gauge | - | Current connection uptime |
| `baileys_pending_messages` | Gauge | - | Messages in send queue |
| `baileys_memory_usage_bytes` | Gauge | - | Process memory usage |

### 4.3 Histogram Metrics

| Metric Name | Type | Buckets | Description |
|-------------|------|---------|-------------|
| `baileys_auth_duration_seconds` | Histogram | 1,5,10,30,60,120,300 | Auth completion time |
| `baileys_message_latency_seconds` | Histogram | 0.1,0.5,1,2,5,10 | Message send latency |
| `baileys_reconnect_duration_seconds` | Histogram | 1,5,10,30,60 | Reconnection time |
| `baileys_qr_scan_duration_seconds` | Histogram | 5,15,30,60,120 | Time to scan QR |

### 4.4 Prometheus Metrics Implementation

```typescript
// lib/metrics.ts
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

export class BaileysMetrics {
  private registry: Registry;

  // Counters
  public authTotal: Counter;
  public authSuccess: Counter;
  public authFailure: Counter;
  public reconnectTotal: Counter;
  public messageSentTotal: Counter;
  public messageReceivedTotal: Counter;

  // Gauges
  public connectionStatus: Gauge;
  public activeSessions: Gauge;
  public sessionAge: Gauge;
  public connectionUptime: Gauge;

  // Histograms
  public authDuration: Histogram;
  public messageLatency: Histogram;
  public reconnectDuration: Histogram;

  constructor() {
    this.registry = new Registry();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Auth counters
    this.authTotal = new Counter({
      name: 'baileys_auth_total',
      help: 'Total authentication attempts',
      labelNames: ['status', 'method'],
      registers: [this.registry],
    });

    this.authSuccess = new Counter({
      name: 'baileys_auth_success_total',
      help: 'Successful authentication count',
      labelNames: ['method'],
      registers: [this.registry],
    });

    this.authFailure = new Counter({
      name: 'baileys_auth_failure_total',
      help: 'Failed authentication count',
      labelNames: ['error_code'],
      registers: [this.registry],
    });

    // Connection gauges
    this.connectionStatus = new Gauge({
      name: 'baileys_connection_status',
      help: 'Current connection status (1=connected, 0=disconnected)',
      registers: [this.registry],
    });

    this.connectionUptime = new Gauge({
      name: 'baileys_connection_uptime_seconds',
      help: 'Current connection uptime in seconds',
      registers: [this.registry],
    });

    // Histograms
    this.authDuration = new Histogram({
      name: 'baileys_auth_duration_seconds',
      help: 'Authentication duration in seconds',
      labelNames: ['method', 'status'],
      buckets: [1, 5, 10, 30, 60, 120, 300],
      registers: [this.registry],
    });

    this.messageLatency = new Histogram({
      name: 'baileys_message_latency_seconds',
      help: 'Message send latency in seconds',
      labelNames: ['type'],
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
  }

  // Helper methods
  public recordAuthSuccess(method: string, durationMs: number): void {
    this.authTotal.inc({ status: 'success', method });
    this.authSuccess.inc({ method });
    this.authDuration.observe({ method, status: 'success' }, durationMs / 1000);
  }

  public recordAuthFailure(method: string, errorCode: string, durationMs: number): void {
    this.authTotal.inc({ status: 'failure', method });
    this.authFailure.inc({ error_code: errorCode });
    this.authDuration.observe({ method, status: 'failure' }, durationMs / 1000);
  }

  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

### 4.5 Metrics Endpoint

```typescript
// routes/metrics.ts
import { Router } from 'express';
import { metrics } from '../lib/metrics';

const router = Router();

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    res.send(await metrics.getMetrics());
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

export default router;
```

---

## 5. Alerting Rules

### 5.1 Critical Alerts (P1 - Immediate Action)

| Alert Name | Condition | Duration | Severity |
|------------|-----------|----------|----------|
| `BaileysAuthFailureHigh` | auth_failure_rate > 50% | 2 min | critical |
| `BaileysConnectionDown` | connection_status == 0 | 5 min | critical |
| `BaileysAccountBanned` | banned event detected | immediate | critical |
| `BaileysSessionCorrupted` | session_corrupted event | immediate | critical |

### 5.2 Warning Alerts (P2 - Needs Attention)

| Alert Name | Condition | Duration | Severity |
|------------|-----------|----------|----------|
| `BaileysReconnectHigh` | reconnect_total > 10 in 5 min | 5 min | warning |
| `BaileysAuthSlow` | auth_duration_p95 > 60s | 5 min | warning |
| `BaileysMessageLatencyHigh` | message_latency_p95 > 5s | 5 min | warning |
| `BaileysQrTimeout` | qr_generated > 5 in 10 min | 10 min | warning |

### 5.3 Informational Alerts (P3 - Monitor)

| Alert Name | Condition | Duration | Severity |
|------------|-----------|----------|----------|
| `BaileysSessionExpired` | session_expired event | immediate | info |
| `BaileysRateLimited` | rate_limit event | immediate | info |
| `BaileysMemoryHigh` | memory_usage > 80% | 10 min | info |

### 5.4 Prometheus Alert Rules

```yaml
# alerts/baileys.yml
groups:
  - name: baileys_critical
    interval: 30s
    rules:
      - alert: BaileysAuthFailureHigh
        expr: |
          (
            sum(rate(baileys_auth_failure_total[5m]))
            /
            sum(rate(baileys_auth_total[5m]))
          ) > 0.5
        for: 2m
        labels:
          severity: critical
          service: baileys
        annotations:
          summary: "High authentication failure rate"
          description: "Auth failure rate is {{ $value | humanizePercentage }} over the last 5 minutes"
          runbook_url: "https://runbooks.example.com/baileys/auth-failure"

      - alert: BaileysConnectionDown
        expr: baileys_connection_status == 0
        for: 5m
        labels:
          severity: critical
          service: baileys
        annotations:
          summary: "WhatsApp connection is down"
          description: "Baileys has been disconnected for more than 5 minutes"
          runbook_url: "https://runbooks.example.com/baileys/connection-down"

      - alert: BaileysAccountBanned
        expr: increase(baileys_auth_failure_total{error_code="BANNED"}[1h]) > 0
        for: 0m
        labels:
          severity: critical
          service: baileys
        annotations:
          summary: "WhatsApp account may be banned"
          description: "Received ban error during authentication"
          runbook_url: "https://runbooks.example.com/baileys/account-banned"

  - name: baileys_warning
    interval: 1m
    rules:
      - alert: BaileysReconnectHigh
        expr: increase(baileys_reconnect_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
          service: baileys
        annotations:
          summary: "High reconnection rate"
          description: "{{ $value }} reconnection attempts in the last 5 minutes"

      - alert: BaileysAuthSlow
        expr: histogram_quantile(0.95, rate(baileys_auth_duration_seconds_bucket[5m])) > 60
        for: 5m
        labels:
          severity: warning
          service: baileys
        annotations:
          summary: "Authentication is slow"
          description: "P95 auth duration is {{ $value | humanizeDuration }}"

      - alert: BaileysMessageLatencyHigh
        expr: histogram_quantile(0.95, rate(baileys_message_latency_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
          service: baileys
        annotations:
          summary: "High message send latency"
          description: "P95 message latency is {{ $value | humanizeDuration }}"
```

### 5.5 Notification Channels

```yaml
# alertmanager/config.yml
route:
  receiver: 'default'
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      continue: true
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#whatsapp-sla-alerts'
        send_resolved: true

  - name: 'critical-alerts'
    slack_configs:
      - channel: '#whatsapp-sla-critical'
        send_resolved: true
        color: '{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}'
    telegram_configs:
      - chat_id: ${TELEGRAM_ALERT_CHAT_ID}
        bot_token: ${TELEGRAM_BOT_TOKEN}
        send_resolved: true

  - name: 'warning-alerts'
    slack_configs:
      - channel: '#whatsapp-sla-alerts'
        send_resolved: true
        color: 'warning'
```

---

## 6. Dashboard Requirements

### 6.1 Real-time Connection Status Panel

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONNECTION STATUS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐            │
│   │  STATUS   │     │  UPTIME   │     │   JID     │            │
│   │   ████    │     │  12h 34m  │     │ 6281****  │            │
│   │ CONNECTED │     │           │     │ @s.wa.net │            │
│   └───────────┘     └───────────┘     └───────────┘            │
│                                                                  │
│   Last Connected: 2026-03-26 10:30:00 WIB                       │
│   Session Age: 2 days 5 hours                                    │
│   Reconnections Today: 3                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Queries:**
```promql
# Connection status indicator
baileys_connection_status

# Connection uptime
baileys_connection_uptime_seconds

# Session age
baileys_session_age_seconds

# Reconnections today
increase(baileys_reconnect_total[24h])
```

### 6.2 Authentication Success/Failure Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                AUTH SUCCESS / FAILURE (24h)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  100% ┤                                                          │
│       │   ████████████████████████████████████████████████       │
│   75% ┤   ████████████████████████████████████████████████       │
│       │   ████████████████████████████████████████████████       │
│   50% ┤   ████████████████████████████████████████████████       │
│       │   ████████████████████████████████████████████████       │
│   25% ┤   ████████████████████████████████████████████████       │
│       │   ▓▓▓▓▓▓▓▓▓▓▓▓                                          │
│    0% ┼───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───▶     │
│       00  02  04  06  08  10  12  14  16  18  20  22  24        │
│                                                                  │
│   ████ Success: 45    ▓▓▓▓ Failure: 3    Success Rate: 93.75%   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Queries:**
```promql
# Auth success rate over time
sum(rate(baileys_auth_success_total[1h])) / sum(rate(baileys_auth_total[1h])) * 100

# Auth success count
sum(increase(baileys_auth_success_total[24h]))

# Auth failure count
sum(increase(baileys_auth_failure_total[24h]))

# Auth failure by error code
sum by (error_code) (increase(baileys_auth_failure_total[24h]))
```

### 6.3 Message Throughput Panel

```
┌─────────────────────────────────────────────────────────────────┐
│                   MESSAGE THROUGHPUT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    SENT/min     │  │   RECEIVED/min  │  │   PENDING       │  │
│  │      12.5       │  │       8.3       │  │       3         │  │
│  │    ▲ +15%       │  │    ▲ +8%        │  │    ◆ stable     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  500 ┤                         ╱╲                                │
│      │                    ╱╲  ╱  ╲                              │
│  400 ┤               ╱╲  ╱  ╲╱    ╲                             │
│      │          ╱╲  ╱  ╲╱          ╲  ╱╲                        │
│  300 ┤     ╱╲  ╱  ╲╱                ╲╱  ╲                       │
│      │    ╱  ╲╱                          ╲╱╲                    │
│  200 ┤───╱─────────────────────────────────────▶                │
│      00:00  04:00  08:00  12:00  16:00  20:00  24:00           │
│                                                                  │
│   ─── Sent    ─ ─ Received                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Queries:**
```promql
# Messages sent per minute
rate(baileys_message_sent_total[1m]) * 60

# Messages received per minute
rate(baileys_message_received_total[1m]) * 60

# Pending messages
baileys_pending_messages

# Message throughput over time (sent)
sum(rate(baileys_message_sent_total[5m])) * 60

# Message throughput over time (received)
sum(rate(baileys_message_received_total[5m])) * 60
```

### 6.4 Latency Distribution Panel

```
┌─────────────────────────────────────────────────────────────────┐
│                  LATENCY DISTRIBUTION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Message Send Latency (P50/P95/P99)                             │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ P50: 234ms   │ P95: 890ms   │ P99: 2.1s                    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│                                                                  │
│  Auth Duration (P50/P95/P99)                                    │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ P50: 15s     │ P95: 45s     │ P99: 120s                    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│                                                                  │
│  Reconnect Duration (P50/P95/P99)                               │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ P50: 2.5s    │ P95: 8s      │ P99: 15s                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Queries:**
```promql
# Message latency percentiles
histogram_quantile(0.50, rate(baileys_message_latency_seconds_bucket[5m]))
histogram_quantile(0.95, rate(baileys_message_latency_seconds_bucket[5m]))
histogram_quantile(0.99, rate(baileys_message_latency_seconds_bucket[5m]))

# Auth duration percentiles
histogram_quantile(0.50, rate(baileys_auth_duration_seconds_bucket[5m]))
histogram_quantile(0.95, rate(baileys_auth_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(baileys_auth_duration_seconds_bucket[5m]))
```

### 6.5 Error Rate Panel

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR BREAKDOWN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Error Rate (Last Hour): 2.3%                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  CONNECTION_LOST ████████████████████ 45%               │    │
│  │  AUTH_TIMEOUT    ████████████ 28%                       │    │
│  │  RATE_LIMITED    ██████ 15%                             │    │
│  │  MESSAGE_FAILED  ████ 8%                                │    │
│  │  OTHER           ██ 4%                                  │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Recent Errors:                                                  │
│  • 10:45:23 - CONNECTION_LOST: WebSocket closed unexpectedly   │
│  • 10:32:15 - AUTH_TIMEOUT: QR scan timeout                    │
│  • 10:28:03 - RATE_LIMITED: Too many requests                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 Grafana Dashboard JSON

```json
{
  "title": "Baileys WhatsApp - Observability Dashboard",
  "tags": ["whatsapp", "baileys", "observability"],
  "timezone": "Asia/Jakarta",
  "refresh": "30s",
  "panels": [
    {
      "title": "Connection Status",
      "type": "stat",
      "gridPos": { "x": 0, "y": 0, "w": 4, "h": 4 },
      "targets": [
        {
          "expr": "baileys_connection_status",
          "legendFormat": "Status"
        }
      ],
      "mappings": [
        { "value": 1, "text": "CONNECTED", "color": "green" },
        { "value": 0, "text": "DISCONNECTED", "color": "red" }
      ]
    },
    {
      "title": "Connection Uptime",
      "type": "stat",
      "gridPos": { "x": 4, "y": 0, "w": 4, "h": 4 },
      "targets": [
        {
          "expr": "baileys_connection_uptime_seconds",
          "legendFormat": "Uptime"
        }
      ],
      "unit": "s"
    },
    {
      "title": "Auth Success Rate",
      "type": "gauge",
      "gridPos": { "x": 8, "y": 0, "w": 4, "h": 4 },
      "targets": [
        {
          "expr": "sum(rate(baileys_auth_success_total[1h])) / sum(rate(baileys_auth_total[1h])) * 100"
        }
      ],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": 0, "color": "red" },
          { "value": 80, "color": "yellow" },
          { "value": 95, "color": "green" }
        ]
      }
    },
    {
      "title": "Message Throughput",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 4, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "rate(baileys_message_sent_total[5m]) * 60",
          "legendFormat": "Sent/min"
        },
        {
          "expr": "rate(baileys_message_received_total[5m]) * 60",
          "legendFormat": "Received/min"
        }
      ]
    },
    {
      "title": "Auth Events",
      "type": "timeseries",
      "gridPos": { "x": 12, "y": 0, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "increase(baileys_auth_success_total[1h])",
          "legendFormat": "Success"
        },
        {
          "expr": "increase(baileys_auth_failure_total[1h])",
          "legendFormat": "Failure"
        }
      ]
    },
    {
      "title": "Error Breakdown",
      "type": "piechart",
      "gridPos": { "x": 12, "y": 8, "w": 6, "h": 8 },
      "targets": [
        {
          "expr": "sum by (error_code) (increase(baileys_auth_failure_total[24h]))",
          "legendFormat": "{{ error_code }}"
        }
      ]
    },
    {
      "title": "Latency Percentiles",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 12, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.50, rate(baileys_message_latency_seconds_bucket[5m]))",
          "legendFormat": "P50"
        },
        {
          "expr": "histogram_quantile(0.95, rate(baileys_message_latency_seconds_bucket[5m]))",
          "legendFormat": "P95"
        },
        {
          "expr": "histogram_quantile(0.99, rate(baileys_message_latency_seconds_bucket[5m]))",
          "legendFormat": "P99"
        }
      ]
    }
  ]
}
```

---

## 7. Implementation Guide

### 7.1 Logger Service Implementation

```typescript
// lib/logger.ts
import { createLogger, format, transports } from 'winston';
import { MaskingRules, sensitiveFields } from './masking';

const { combine, timestamp, json, errors, printf } = format;

// Custom format untuk masking sensitive data
const maskSensitiveData = format((info) => {
  const mask = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const masked = { ...obj };
    for (const [key, value] of Object.entries(masked)) {
      // Check if key is sensitive
      if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
        masked[key] = '[REDACTED]';
        continue;
      }

      // Apply specific masking rules
      if (key === 'jid' && typeof value === 'string') {
        masked[key] = MaskingRules.jid(value);
      } else if ((key === 'phone' || key === 'to' || key === 'from') && typeof value === 'string') {
        masked[key] = MaskingRules.phoneNumber(value);
      } else if (key === 'qr' || key === 'qrCode') {
        masked[key] = MaskingRules.qrCode(value as string);
      } else if (typeof value === 'object') {
        masked[key] = mask(value);
      }
    }
    return masked;
  };

  if (info.data) {
    info.data = mask(info.data);
  }
  if (info.context) {
    info.context = mask(info.context);
  }

  return info;
});

// Create logger instance
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: {
      name: 'baileys-auth',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      instance_id: process.env.HOSTNAME || 'local',
    },
  },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    maskSensitiveData(),
    json()
  ),
  transports: [
    // Console output
    new transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? combine(
            format.colorize(),
            printf(({ timestamp, level, event, message, ...rest }) => {
              return `${timestamp} [${level}] ${event}: ${message}`;
            })
          )
        : json(),
    }),

    // File output - all logs
    new transports.File({
      filename: 'storage/logs/baileys/baileys.log',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 30,
      tailable: true,
    }),

    // File output - errors only
    new transports.File({
      filename: 'storage/logs/baileys/baileys-error.log',
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 90,
    }),
  ],
});

// Convenience methods
export const logAuthStart = (sessionId: string, method: string) => {
  logger.info({
    event: 'auth:start',
    message: 'WhatsApp authentication started',
    context: { session_id: sessionId },
    data: { auth_method: method },
  });
};

export const logAuthSuccess = (sessionId: string, jid: string, method: string, durationMs: number) => {
  logger.info({
    event: 'auth:success',
    message: 'WhatsApp authentication successful',
    context: { session_id: sessionId },
    data: { jid, auth_method: method, auth_duration_ms: durationMs },
    duration_ms: durationMs,
  });
};

export const logAuthFailure = (sessionId: string, errorCode: string, reason: string, attempts: number) => {
  logger.error({
    event: 'auth:failure',
    message: 'WhatsApp authentication failed',
    context: { session_id: sessionId },
    data: { attempt_number: attempts },
    error: { code: errorCode, message: reason },
  });
};

export const logConnectionOpen = (sessionId: string, connectionTimeMs: number) => {
  logger.info({
    event: 'connection:open',
    message: 'WebSocket connection established',
    context: { session_id: sessionId },
    data: { connection_time_ms: connectionTimeMs },
    duration_ms: connectionTimeMs,
  });
};

export const logConnectionClose = (sessionId: string, code: number, reason: string, uptimeSeconds: number) => {
  logger.warn({
    event: 'connection:close',
    message: 'WebSocket connection closed',
    context: { session_id: sessionId },
    data: { code, reason, uptime_seconds: uptimeSeconds },
  });
};

export const logMessageSent = (sessionId: string, to: string, msgId: string, type: string, latencyMs: number) => {
  logger.debug({
    event: 'message:sent',
    message: 'Message sent successfully',
    context: { session_id: sessionId },
    data: { to, msg_id: msgId, type, latency_ms: latencyMs },
    duration_ms: latencyMs,
  });
};

export const logMessageReceived = (sessionId: string, from: string, msgId: string, type: string) => {
  logger.debug({
    event: 'message:received',
    message: 'Message received',
    context: { session_id: sessionId },
    data: { from, msg_id: msgId, type },
  });
};
```

### 7.2 Laravel Integration

```php
<?php
// config/logging.php - Add baileys channel

return [
    'channels' => [
        // ... existing channels ...

        'baileys' => [
            'driver' => 'daily',
            'path' => storage_path('logs/baileys/laravel-baileys.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'formatter' => \Monolog\Formatter\JsonFormatter::class,
        ],

        'baileys-error' => [
            'driver' => 'daily',
            'path' => storage_path('logs/baileys/laravel-baileys-error.log'),
            'level' => 'error',
            'days' => 90,
            'formatter' => \Monolog\Formatter\JsonFormatter::class,
        ],
    ],
];
```

```php
<?php
// app/Services/BaileysLogger.php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class BaileysLogger
{
    private string $sessionId;

    public function __construct(string $sessionId)
    {
        $this->sessionId = $sessionId;
    }

    public function authStart(string $method): void
    {
        Log::channel('baileys')->info('WhatsApp authentication started', [
            'event' => 'auth:start',
            'session_id' => $this->sessionId,
            'data' => ['auth_method' => $method],
        ]);
    }

    public function authSuccess(string $jid, string $method, int $durationMs): void
    {
        Log::channel('baileys')->info('WhatsApp authentication successful', [
            'event' => 'auth:success',
            'session_id' => $this->sessionId,
            'data' => [
                'jid' => $this->maskJid($jid),
                'auth_method' => $method,
                'auth_duration_ms' => $durationMs,
            ],
        ]);
    }

    public function authFailure(string $errorCode, string $reason, int $attempts): void
    {
        Log::channel('baileys-error')->error('WhatsApp authentication failed', [
            'event' => 'auth:failure',
            'session_id' => $this->sessionId,
            'data' => ['attempt_number' => $attempts],
            'error' => [
                'code' => $errorCode,
                'message' => $reason,
            ],
        ]);
    }

    private function maskJid(string $jid): string
    {
        $parts = explode('@', $jid);
        $phone = $parts[0] ?? '';
        $domain = $parts[1] ?? 's.whatsapp.net';

        if (strlen($phone) < 8) {
            return '[INVALID_JID]';
        }

        return substr($phone, 0, 4) . '****' . substr($phone, -4) . '@' . $domain;
    }
}
```

### 7.3 Health Check Endpoint

```typescript
// routes/health.ts
import { Router, Request, Response } from 'express';
import { baileysClient } from '../services/baileys';
import { metrics } from '../lib/metrics';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    baileys: {
      status: 'healthy' | 'unhealthy';
      connected: boolean;
      uptime_seconds?: number;
      session_age_seconds?: number;
      jid?: string;
    };
    metrics: {
      status: 'healthy' | 'unhealthy';
      error?: string;
    };
  };
}

router.get('/health', async (req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      baileys: {
        status: 'healthy',
        connected: false,
      },
      metrics: {
        status: 'healthy',
      },
    },
  };

  // Check Baileys connection
  try {
    const state = baileysClient.getState();
    health.checks.baileys = {
      status: state.connected ? 'healthy' : 'unhealthy',
      connected: state.connected,
      uptime_seconds: state.uptimeSeconds,
      session_age_seconds: state.sessionAgeSeconds,
      jid: state.jid, // Already masked by the service
    };

    if (!state.connected) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.baileys = {
      status: 'unhealthy',
      connected: false,
    };
    health.status = 'unhealthy';
  }

  // Check metrics collection
  try {
    await metrics.getMetrics();
    health.checks.metrics.status = 'healthy';
  } catch (error) {
    health.checks.metrics = {
      status: 'unhealthy',
      error: (error as Error).message,
    };
    if (health.status === 'healthy') {
      health.status = 'degraded';
    }
  }

  const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

// Liveness probe - simple alive check
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe - ready to accept traffic
router.get('/health/ready', async (req: Request, res: Response) => {
  const connected = baileysClient.isConnected();

  if (connected) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not_ready', reason: 'baileys_disconnected' });
  }
});

export default router;
```

---

## 8. Data Retention Policy

### 8.1 Retention by Log Type

| Log Type | Hot Storage | Warm Storage | Cold Archive | Total Retention |
|----------|-------------|--------------|--------------|-----------------|
| Debug Logs | 7 days | - | - | 7 days |
| Info Logs | 30 days | 30 days | - | 60 days |
| Warning Logs | 30 days | 60 days | - | 90 days |
| Error Logs | 30 days | 60 days | 90 days | 180 days |
| Auth Events | 30 days | 60 days | 275 days | 365 days |
| Security Events | 90 days | 180 days | 365 days | 635 days |

### 8.2 Storage Locations

```
storage/
└── logs/
    └── baileys/
        ├── current/              # Hot storage (7-30 days)
        │   ├── baileys.log
        │   ├── baileys-error.log
        │   └── baileys-YYYY-MM-DD.log
        ├── archive/              # Warm storage (compressed)
        │   └── YYYY-MM/
        │       └── baileys-YYYY-MM-DD.log.gz
        └── cold/                 # Cold storage (optional S3/GCS)
            └── YYYY/
                └── MM/
                    └── baileys-YYYY-MM-DD.log.gz
```

### 8.3 Log Rotation Script

```bash
#!/bin/bash
# scripts/rotate-logs.sh

LOG_DIR="/var/www/whatsapp-sla/storage/logs/baileys"
ARCHIVE_DIR="${LOG_DIR}/archive"
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_MONTH=$(date +%Y-%m)

# Create archive directory
mkdir -p "${ARCHIVE_DIR}/${CURRENT_MONTH}"

# Compress logs older than 7 days
find "${LOG_DIR}" -maxdepth 1 -name "*.log" -mtime +7 -exec gzip {} \;

# Move compressed logs to archive
find "${LOG_DIR}" -maxdepth 1 -name "*.gz" -exec mv {} "${ARCHIVE_DIR}/${CURRENT_MONTH}/" \;

# Delete archived logs older than 90 days
find "${ARCHIVE_DIR}" -name "*.gz" -mtime +90 -delete

# Delete empty archive directories
find "${ARCHIVE_DIR}" -type d -empty -delete

echo "[$(date)] Log rotation completed"
```

### 8.4 Cron Configuration

```cron
# /etc/cron.d/baileys-logs

# Rotate logs daily at 2 AM
0 2 * * * root /var/www/whatsapp-sla/scripts/rotate-logs.sh >> /var/log/baileys-rotation.log 2>&1

# Clean up old metrics data weekly
0 3 * * 0 root /var/www/whatsapp-sla/scripts/clean-metrics.sh >> /var/log/baileys-metrics-cleanup.log 2>&1
```

---

## Appendix A: Error Codes Reference

| Code | Description | Severity | Action |
|------|-------------|----------|--------|
| `AUTH_TIMEOUT` | QR scan timeout | ERROR | Retry auth |
| `AUTH_INVALID_SESSION` | Session corrupted | ERROR | Clear session, re-auth |
| `AUTH_BANNED` | Account banned | CRITICAL | Contact support |
| `CONNECTION_LOST` | WebSocket disconnected | WARN | Auto-reconnect |
| `CONNECTION_FAILED` | Cannot establish connection | ERROR | Check network |
| `RATE_LIMITED` | Too many requests | WARN | Back off |
| `MESSAGE_FAILED` | Message send failed | ERROR | Retry with backoff |
| `SESSION_EXPIRED` | Session no longer valid | WARN | Re-authenticate |
| `STORAGE_ERROR` | File system error | ERROR | Check permissions |

## Appendix B: Grafana Dashboard Import

Dashboard dapat di-import ke Grafana menggunakan JSON di section 6.6 atau melalui URL:

```
https://grafana.com/grafana/dashboards/XXXXX (placeholder)
```

## Appendix C: Troubleshooting

### High Error Rate
1. Check `auth:failure` logs for error codes
2. Verify network connectivity
3. Check session storage permissions
4. Review rate limiting status

### Connection Drops
1. Check `connection:close` logs for reasons
2. Verify WebSocket connectivity
3. Check for memory leaks
4. Review reconnect metrics

### Slow Authentication
1. Check `auth_duration` histogram
2. Review QR code generation logs
3. Check network latency to WhatsApp servers
4. Verify storage I/O performance

---

*Document generated by Observability Agent*
*Last review: 2026-03-26*
