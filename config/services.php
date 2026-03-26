<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Baileys Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration untuk berkomunikasi dengan Baileys Node.js service
    | yang mengelola koneksi WhatsApp. Semua konfigurasi disini WAJIB
    | dikonfigurasi dengan benar untuk menjalankan sistem.
    |
    */
    'baileys' => [
        'url' => env('BAILEYS_API_URL', 'http://127.0.0.1:3002'),
        'api_key' => env('BAILEYS_API_KEY', env('API_BOT_TOKEN')),
        'timeout' => (int) env('BAILEYS_TIMEOUT', 30),
        'retry_attempts' => (int) env('BAILEYS_RETRY_ATTEMPTS', 3),
        'retry_delay' => (int) env('BAILEYS_RETRY_DELAY', 1000), // milliseconds
        'webhook_url' => env('BAILEYS_WEBHOOK_URL', env('APP_URL').'/api/whatsapp/webhook'),

        // Session management
        'session_path' => env('BAILEYS_SESSION_PATH', 'app/whatsapp-sessions'),
        'auto_reconnect' => (bool) env('BAILEYS_AUTO_RECONNECT', true),
        'reconnect_interval' => (int) env('BAILEYS_RECONNECT_INTERVAL', 5), // seconds
        'max_retry_count' => (int) env('BAILEYS_MAX_RETRY_COUNT', 10),

        // Dedicated Redis configuration for Baileys events
        'redis_host' => env('BAILEYS_REDIS_HOST', '127.0.0.1'),
        'redis_port' => (int) env('BAILEYS_REDIS_PORT', 6379),
        'redis_password' => env('BAILEYS_REDIS_PASSWORD'),
        'redis_db' => (int) env('BAILEYS_REDIS_DB', 1),
        'redis_prefix' => env('BAILEYS_REDIS_PREFIX', 'baileys_'),

        // Security & Rate Limiting
        'rate_limit_enabled' => (bool) env('BAILEYS_RATE_LIMIT_ENABLED', true),
        'rate_limit_max' => (int) env('BAILEYS_RATE_LIMIT_MAX', 100),
        'rate_limit_window' => (int) env('BAILEYS_RATE_LIMIT_WINDOW', 60), // seconds

        // Logging & Monitoring
        'log_level' => env('BAILEYS_LOG_LEVEL', 'info'),
        'log_retention_days' => (int) env('BAILEYS_LOG_RETENTION_DAYS', 30),

        // Health Check
        'health_check_interval' => (int) env('BAILEYS_HEALTH_CHECK_INTERVAL', 60), // seconds
        'health_check_enabled' => (bool) env('BAILEYS_HEALTH_CHECK_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Business API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration untuk WhatsApp Business API (Meta)
    |
    */
    'whatsapp' => [
        'api_url' => env('WA_API_URL', 'https://graph.facebook.com/v22.0'),
        'phone_number_id' => env('WA_PHONE_NUMBER_ID'),
        'access_token' => env('WA_ACCESS_TOKEN'),
        'verify_token' => env('WA_VERIFY_TOKEN'),
        'app_id' => env('WA_APP_ID'),
        'app_secret' => env('WA_APP_SECRET'),
        'business_account_id' => env('WA_BUSINESS_ACCOUNT_ID'),
        'test_number' => env('WA_TEST_NUMBER', '+15551605744'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    | Konfigurasi untuk layanan pihak ketiga seperti Mailgun, Postmark,
    | AWS dan lain-lain. File ini menyediakan lokasi sentral untuk
    | kredensial layanan eksternal.
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Business API
    |--------------------------------------------------------------------------
    | Referensi ke config/whatsapp.php untuk detail lengkap
    */
    'github' => [
        'token' => env('GITHUB_TOKEN'),
        'owner' => env('GITHUB_OWNER'),
        'email' => env('GITHUB_EMAIL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Slack Notifications (Opsional)
    |--------------------------------------------------------------------------
    */
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Telegram Bot (Opsional)
    |--------------------------------------------------------------------------
    | Untuk notifikasi admin
    */
    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'chat_id' => env('TELEGRAM_CHAT_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Bot API Token
    |--------------------------------------------------------------------------
    | Token untuk autentikasi Python bot ke Laravel API
    */
    'bot' => [
        'api_token' => env('API_BOT_TOKEN'),
        'internal_secret' => env('BOT_INTERNAL_SECRET', 'sla-bot-internal-secret-2024'),
        'admin_phones' => explode(',', env('BOT_ADMIN_PHONES', '6281385427537')),
    ],

];
