<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class WhatsAppStatusService
{
    /**
     * Get current WhatsApp connection status
     */
    public function getConnectionStatus(): array
    {
        return [
            'connected' => Cache::get('whatsapp:connected', false),
            'auth_status' => Cache::get('whatsapp:auth_status', 'unknown'),
            'connection_status' => Cache::get('whatsapp:connection_status', 'unknown'),
            'qr_required' => Cache::get('whatsapp:qr_required', false),
            'qr_code' => Cache::get('whatsapp:qr_code'),
            'last_connected_at' => Cache::get('whatsapp:last_connected_at'),
            'auth_failure_reason' => Cache::get('whatsapp:auth_failure_reason'),
            'session_id' => Cache::get('whatsapp:session_id'),
        ];
    }

    /**
     * Check if WhatsApp is ready to send messages
     */
    public function isReady(): bool
    {
        return Cache::get('whatsapp:connected', false) &&
               Cache::get('whatsapp:auth_status') === 'success';
    }

    /**
     * Get QR code for authentication
     */
    public function getQRCode(): ?string
    {
        return Cache::get('whatsapp:qr_code');
    }

    /**
     * Clear all WhatsApp cache data
     */
    public function clearCache(): void
    {
        Cache::forget('whatsapp:connected');
        Cache::forget('whatsapp:auth_status');
        Cache::forget('whatsapp:auth_data');
        Cache::forget('whatsapp:connection_status');
        Cache::forget('whatsapp:connection_data');
        Cache::forget('whatsapp:qr_required');
        Cache::forget('whatsapp:qr_code');
        Cache::forget('whatsapp:session_id');
        Cache::forget('whatsapp:auth_failure_reason');
        Cache::forget('whatsapp:connecting');
    }

    /**
     * Send test event to Redis for testing listener
     */
    public function sendTestEvent(string $eventType, array $data = []): bool
    {
        try {
            $payload = [
                'event' => $eventType,
                'data' => $data,
                'timestamp' => now()->toISOString(),
                'source' => 'test',
            ];

            Redis::publish('baileys:events', json_encode($payload));
            Log::info("Test event sent: {$eventType}", $payload);

            return true;
        } catch (Exception $e) {
            Log::error('Failed to send test event: '.$e->getMessage());

            return false;
        }
    }
}
