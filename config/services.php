<?php

return [

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
    'whatsapp' => [
        'api_url' => env('WA_API_URL', 'https://graph.facebook.com/v18.0'),
        'phone_number_id' => env('WA_PHONE_NUMBER_ID'),
        'access_token' => env('WA_ACCESS_TOKEN'),
        'verify_token' => env('WA_VERIFY_TOKEN'),
    ],

    /*
    |--------------------------------------------------------------------------
    | GitHub API
    |--------------------------------------------------------------------------
    | Untuk CI/CD dan integrasi GitHub
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
    ],

];
