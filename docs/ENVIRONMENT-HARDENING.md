# Environment Hardening - Baileys Integration

## Overview

Dokumen ini menjelaskan konfigurasi environment yang telah di-hardening untuk integrasi Baileys WhatsApp service dengan Laravel application.

## Security Layers

### 1. Configuration Validation

BaileysServiceProvider melakukan validasi komprehensif saat startup:

- ✅ **Core Config Validation**: Memastikan semua konfigurasi wajib tersedia
- ✅ **Security Validation**: Mencegah penggunaan default/weak API keys
- ✅ **Storage Validation**: Memverifikasi permissions dan disk space
- ✅ **Network Validation**: Test koneksi ke services
- ✅ **Performance Validation**: Optimasi timeout dan retry settings

### 2. Environment Variables

#### Required Configuration

```bash
# Core Baileys Configuration
BAILEYS_API_URL=http://localhost:3002
BAILEYS_API_KEY=your_secure_api_key_here
BAILEYS_SESSION_PATH=app/whatsapp-sessions
BAILEYS_WEBHOOK_URL=http://localhost/api/whatsapp/webhook

# Security Settings
BAILEYS_RATE_LIMIT_ENABLED=true
BAILEYS_RATE_LIMIT_MAX=100
BAILEYS_RATE_LIMIT_WINDOW=60

# Performance Settings
BAILEYS_TIMEOUT=30
BAILEYS_RETRY_ATTEMPTS=3
BAILEYS_RETRY_DELAY=1000

# Redis Configuration for Baileys
BAILEYS_REDIS_HOST=127.0.0.1
BAILEYS_REDIS_PORT=6379
BAILEYS_REDIS_DB=1
BAILEYS_REDIS_PREFIX=baileys_
```

#### Advanced Configuration

```bash
# Session Management
BAILEYS_AUTO_RECONNECT=true
BAILEYS_RECONNECT_INTERVAL=5
BAILEYS_MAX_RETRY_COUNT=10

# Logging & Monitoring
BAILEYS_LOG_LEVEL=info
BAILEYS_LOG_RETENTION_DAYS=30

# Health Checks
BAILEYS_HEALTH_CHECK_ENABLED=true
BAILEYS_HEALTH_CHECK_INTERVAL=60
```

## Directory Structure

### Secure Storage Paths

```
storage/
├── app/
│   ├── whatsapp-sessions/        # Session data (0700 perms)
│   │   ├── .gitignore           # Auto-generated security
│   │   └── *.json              # Session files
│   ├── baileys-auth/           # Auth state
│   ├── baileys-media/          # Temporary media
│   └── baileys-cache/          # Performance cache
└── logs/
    └── baileys/                # Baileys-specific logs
```

### Security Features

1. **Directory Permissions**: Auto-set to `0700` (owner only)
2. **Gitignore Protection**: Auto-generated `.gitignore` untuk session data
3. **Disk Space Monitoring**: Minimum 100MB requirement check
4. **Path Validation**: Writable check pada semua storage paths

## Validation Commands

### Manual Environment Check

```bash
# Basic validation
php artisan baileys:validate-env

# Auto-fix issues where possible
php artisan baileys:validate-env --fix

# Force production-level validation
php artisan baileys:validate-env --production
```

### Output Example

```
🔍 Validating Baileys Environment Configuration...

📋 Core Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ BAILEYS_API_URL is configured
✓ BAILEYS_API_KEY is configured
✓ BAILEYS_SESSION_PATH is configured
✓ BAILEYS_WEBHOOK_URL is configured
✓ APP_KEY is configured

🔒 Security Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ API key strength is adequate
✓ Baileys URL valid untuk production
✓ Rate limiting enabled
✓ Debug mode configuration appropriate

💾 Storage Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Session Path directory exists
✓ Session Path is writable
✓ Session Path has sufficient disk space
✓ Auth State directory exists
✓ Auth State is writable

⚡ Performance Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Timeout configuration optimal
✓ Retry attempts configuration optimal

🌐 Network Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Baileys service reachable
✓ Redis connection for Baileys working

🌉 Bridge Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Bridge URLs configured

📊 Validation Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 All validations passed! Environment is ready.
```

## Startup Validation

### BaileysServiceProvider Features

1. **Smart Skip Logic**: Skip validation during migrations, cache operations
2. **Environment-Aware**: Different validation levels for dev/staging/production
3. **Auto-Recovery**: Create directories, fix permissions where possible
4. **Comprehensive Logging**: Detailed logs untuk troubleshooting
5. **Network Health Checks**: Validate Redis dan Baileys service connectivity

### Production-Specific Checks

- API key strength validation (minimum 16 characters)
- Localhost URL detection dan warning
- Rate limiting enforcement
- Debug mode security check
- Redis connection requirements
- Disk space monitoring

## Configuration Files

### services.php Enhancement

```php
'baileys' => [
    // Core
    'url' => env('BAILEYS_API_URL', 'http://127.0.0.1:3002'),
    'api_key' => env('BAILEYS_API_KEY'),
    'timeout' => (int) env('BAILEYS_TIMEOUT', 30),

    // Session management
    'session_path' => env('BAILEYS_SESSION_PATH', 'app/whatsapp-sessions'),
    'auto_reconnect' => (bool) env('BAILEYS_AUTO_RECONNECT', true),

    // Security & Rate Limiting
    'rate_limit_enabled' => (bool) env('BAILEYS_RATE_LIMIT_ENABLED', true),
    'rate_limit_max' => (int) env('BAILEYS_RATE_LIMIT_MAX', 100),

    // Redis configuration
    'redis_host' => env('BAILEYS_REDIS_HOST', '127.0.0.1'),
    'redis_db' => (int) env('BAILEYS_REDIS_DB', 1),

    // Performance & Health
    'health_check_enabled' => (bool) env('BAILEYS_HEALTH_CHECK_ENABLED', true),
],
```

### baileys.php Configuration

Detail konfigurasi untuk session management, security, dan performance settings.

## Deployment Checklist

### Pre-Production

- [ ] Run `php artisan baileys:validate-env --production`
- [ ] Verify all storage paths are writable
- [ ] Test Redis connectivity
- [ ] Confirm API key strength
- [ ] Check Baileys service health
- [ ] Verify rate limiting configuration

### Production Monitoring

- [ ] Monitor disk space for session storage
- [ ] Track Redis connection health
- [ ] Monitor Baileys service connectivity
- [ ] Review security logs regularly
- [ ] Validate environment after deployments

## Troubleshooting

### Common Issues

1. **Session Path Not Writable**
   ```bash
   chmod 700 storage/app/whatsapp-sessions
   chown www-data:www-data storage/app/whatsapp-sessions
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis service
   redis-cli ping

   # Verify config
   php artisan tinker
   config('services.baileys.redis_host')
   ```

3. **Weak API Key Warning**
   - Generate secure API key (minimum 16 characters)
   - Avoid default values
   - Use random string generator

4. **Baileys Service Unreachable**
   - Verify service is running
   - Check firewall settings
   - Validate URL configuration

### Debug Commands

```bash
# Check configuration
php artisan config:show services.baileys

# Clear all caches
php artisan optimize:clear

# Regenerate environment
php artisan baileys:validate-env --fix

# Test Redis connection
php artisan tinker
Redis::connection('baileys')->ping();
```

## Security Best Practices

### Environment Security

1. **Never commit `.env` files** to version control
2. **Use strong API keys** (minimum 16 characters random)
3. **Enable rate limiting** in all environments
4. **Regular security audits** dengan validation command
5. **Monitor storage permissions** regularly

### Network Security

1. **Use HTTPS** untuk production Baileys service
2. **Implement proper firewall rules**
3. **Regular health checks** untuk services
4. **Monitor unauthorized access attempts**

### Data Protection

1. **Secure session storage** dengan proper permissions
2. **Regular cleanup** old session data
3. **Encrypt sensitive data** at rest
4. **Audit logs** untuk compliance

## Maintenance

### Regular Tasks

```bash
# Weekly security validation
php artisan baileys:validate-env --production

# Monthly cleanup old sessions (manual review first)
find storage/app/whatsapp-sessions -type f -mtime +30

# Quarterly security review
php artisan config:show | grep -i baileys
```

### Updates & Patches

1. **Test validation** setelah Laravel updates
2. **Review security settings** after Baileys updates
3. **Update environment variables** sesuai kebutuhan
4. **Re-run validation** after infrastructure changes

---

## Implementation Status

✅ **COMPLETED**
- Environment variable hardening
- BaileysServiceProvider validation
- Storage security configuration
- Artisan validation command
- Production-ready checks
- Comprehensive documentation

🔒 **Security Level: PRODUCTION READY**

Semua konfigurasi sudah di-hardening dengan validation komprehensif dan siap untuk production deployment.