<?php

return [

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Business API Configuration
    |--------------------------------------------------------------------------
    | Konfigurasi untuk integrasi dengan WhatsApp Business Cloud API
    */

    /*
    |--------------------------------------------------------------------------
    | API Base URL
    |--------------------------------------------------------------------------
    */
    'api_url' => env('WA_API_URL', 'https://graph.facebook.com/v18.0'),

    /*
    |--------------------------------------------------------------------------
    | Phone Number ID
    |--------------------------------------------------------------------------
    | ID nomor telepon bisnis dari Meta Business Suite
    */
    'phone_number_id' => env('WA_PHONE_NUMBER_ID'),

    /*
    |--------------------------------------------------------------------------
    | Access Token
    |--------------------------------------------------------------------------
    | Token akses dari Meta Business Suite untuk autentikasi API
    */
    'access_token' => env('WA_ACCESS_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Verify Token
    |--------------------------------------------------------------------------
    | Token verifikasi untuk webhook subscription
    */
    'verify_token' => env('WA_VERIFY_TOKEN', 'slawa_verify_token'),

    /*
    |--------------------------------------------------------------------------
    | App Credentials
    |--------------------------------------------------------------------------
    | Kredensial aplikasi dari Meta Developer Portal
    */
    'app_id' => env('WA_APP_ID'),
    'app_secret' => env('WA_APP_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | API Version
    |--------------------------------------------------------------------------
    */
    'api_version' => env('WA_API_VERSION', 'v18.0'),

    /*
    |--------------------------------------------------------------------------
    | Message Templates
    |--------------------------------------------------------------------------
    | Template pesan yang sudah disetujui oleh Meta
    */
    'templates' => [
        'order_confirmation' => env('WA_TEMPLATE_ORDER_CONFIRM', 'order_confirmation'),
        'order_shipped' => env('WA_TEMPLATE_ORDER_SHIPPED', 'order_shipped'),
        'order_delivered' => env('WA_TEMPLATE_ORDER_DELIVERED', 'order_delivered'),
        'price_update' => env('WA_TEMPLATE_PRICE_UPDATE', 'price_update'),
        'catalog_update' => env('WA_TEMPLATE_CATALOG_UPDATE', 'catalog_update'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Bot Settings
    |--------------------------------------------------------------------------
    | Pengaturan untuk WhatsApp Bot
    */
    'bot' => [
        'enabled' => env('WA_BOT_ENABLED', true),
        'auto_reply' => env('WA_BOT_AUTO_REPLY', true),
        'response_delay' => env('WA_BOT_RESPONSE_DELAY', 1), // detik
        'max_retries' => env('WA_BOT_MAX_RETRIES', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | SLA Settings
    |--------------------------------------------------------------------------
    | Pengaturan Service Level Agreement untuk response time
    */
    'sla' => [
        'response_time_minutes' => env('WA_SLA_RESPONSE_TIME', 5),
        'escalation_time_minutes' => env('WA_SLA_ESCALATION_TIME', 15),
        'business_hours_start' => env('WA_SLA_HOURS_START', '08:00'),
        'business_hours_end' => env('WA_SLA_HOURS_END', '17:00'),
        'working_days' => env('WA_SLA_WORKING_DAYS', '1,2,3,4,5'), // Senin-Jumat
    ],

    /*
    |--------------------------------------------------------------------------
    | Catalog Settings
    |--------------------------------------------------------------------------
    | Pengaturan untuk katalog produk di WhatsApp
    */
    'catalog' => [
        'id' => env('WA_CATALOG_ID'),
        'sync_enabled' => env('WA_CATALOG_SYNC', true),
        'sync_interval_minutes' => env('WA_CATALOG_SYNC_INTERVAL', 60),
    ],

];
