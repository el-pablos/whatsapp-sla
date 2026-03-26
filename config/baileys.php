<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Baileys Session Configuration
    |--------------------------------------------------------------------------
    | Konfigurasi untuk Baileys WhatsApp session management
    */

    /*
    |--------------------------------------------------------------------------
    | Session Storage Path
    |--------------------------------------------------------------------------
    | Path untuk menyimpan session data Baileys
    */
    'session_path' => env('BAILEYS_SESSION_PATH', storage_path('app/baileys-sessions')),

    /*
    |--------------------------------------------------------------------------
    | Auth State Path
    |--------------------------------------------------------------------------
    | Path untuk menyimpan auth state data
    */
    'auth_state_path' => env('BAILEYS_AUTH_STATE_PATH', storage_path('app/baileys-auth')),

    /*
    |--------------------------------------------------------------------------
    | Media Storage Path
    |--------------------------------------------------------------------------
    | Path untuk temporary media files dari WhatsApp
    */
    'media_path' => env('BAILEYS_MEDIA_PATH', storage_path('app/baileys-media')),

    /*
    |--------------------------------------------------------------------------
    | Logs Path
    |--------------------------------------------------------------------------
    | Path untuk Baileys specific logs
    */
    'logs_path' => env('BAILEYS_LOGS_PATH', storage_path('logs/baileys')),

    /*
    |--------------------------------------------------------------------------
    | Connection Settings
    |--------------------------------------------------------------------------
    | Konfigurasi koneksi Baileys
    */
    'connection' => [
        'print_qr_in_terminal' => env('BAILEYS_PRINT_QR', true),
        'browser' => env('BAILEYS_BROWSER', 'Ubuntu'),
        'version' => env('BAILEYS_VERSION', [2, 2413, 1]),
        'keep_alive_interval' => env('BAILEYS_KEEPALIVE', 30000), // ms
    ],

    /*
    |--------------------------------------------------------------------------
    | Message Settings
    |--------------------------------------------------------------------------
    | Konfigurasi message handling
    */
    'message' => [
        'max_retry_count' => env('BAILEYS_MAX_RETRY', 3),
        'message_retry_interval' => env('BAILEYS_RETRY_INTERVAL', 1000), // ms
        'default_presence' => env('BAILEYS_PRESENCE', 'available'), // available, unavailable, composing
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Settings  
    |--------------------------------------------------------------------------
    | Konfigurasi security untuk Baileys
    */
    'security' => [
        'auto_accept_group_invites' => env('BAILEYS_AUTO_ACCEPT_GROUPS', false),
        'ignore_broadcast_messages' => env('BAILEYS_IGNORE_BROADCAST', true),
        'allowed_jids' => env('BAILEYS_ALLOWED_JIDS', ''), // comma separated
    ],

    /*
    |--------------------------------------------------------------------------
    | Bridge Integration
    |--------------------------------------------------------------------------
    | Settings untuk integrasi dengan Python bot
    */
    'bridge' => [
        'enabled' => env('BAILEYS_BRIDGE_ENABLED', true),
        'api_url' => env('BAILEYS_BRIDGE_API_URL', 'http://localhost:8000/api'),
        'webhook_url' => env('BAILEYS_BRIDGE_WEBHOOK', 'http://localhost:5000/webhook'),
        'timeout' => env('BAILEYS_BRIDGE_TIMEOUT', 30), // seconds
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Settings
    |--------------------------------------------------------------------------
    */
    'performance' => [
        'cache_messages' => env('BAILEYS_CACHE_MESSAGES', true),
        'cache_contacts' => env('BAILEYS_CACHE_CONTACTS', true),  
        'cache_group_metadata' => env('BAILEYS_CACHE_GROUPS', true),
        'max_cached_messages' => env('BAILEYS_MAX_CACHE_MESSAGES', 1000),
    ],

];
