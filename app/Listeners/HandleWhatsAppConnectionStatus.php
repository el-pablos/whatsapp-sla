<?php

namespace App\Listeners;

use App\Events\WhatsAppConnectionStatusChanged;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class HandleWhatsAppConnectionStatus
{
    /**
     * Handle the event.
     */
    public function handle(WhatsAppConnectionStatusChanged $event): void
    {
        $status = $event->status;
        $data = $event->data;

        Log::info("WhatsApp connection status: {$status}", $data);

        // Store connection status
        Cache::put('whatsapp:connection_status', $status, now()->addHour());
        Cache::put('whatsapp:connection_data', $data, now()->addHour());

        switch ($status) {
            case 'open':
                $this->handleConnectionOpen($data);
                break;

            case 'close':
                $this->handleConnectionClosed($data);
                break;

            case 'connecting':
                $this->handleConnectionConnecting($data);
                break;

            case 'qr':
                $this->handleQRRequired($data);
                break;
        }
    }

    /**
     * Handle connection opened
     */
    private function handleConnectionOpen(array $data): void
    {
        Cache::put('whatsapp:connected', true, now()->addHour());
        Cache::put('whatsapp:last_connected_at', now(), now()->addDays(7));

        Log::info('WhatsApp connection established');
    }

    /**
     * Handle connection closed
     */
    private function handleConnectionClosed(array $data): void
    {
        Cache::forget('whatsapp:connected');

        $reason = $data['reason'] ?? 'unknown';
        Log::warning("WhatsApp connection closed: {$reason}", $data);
    }

    /**
     * Handle connecting state
     */
    private function handleConnectionConnecting(array $data): void
    {
        Cache::put('whatsapp:connecting', true, now()->addMinutes(5));
        Log::info('WhatsApp connecting...');
    }

    /**
     * Handle QR code required
     */
    private function handleQRRequired(array $data): void
    {
        Cache::forget('whatsapp:connected');
        Cache::put('whatsapp:qr_required', true, now()->addMinutes(10));

        if (isset($data['qr'])) {
            Cache::put('whatsapp:qr_code', $data['qr'], now()->addMinutes(2));
        }

        Log::info('WhatsApp QR scan required');
    }
}
