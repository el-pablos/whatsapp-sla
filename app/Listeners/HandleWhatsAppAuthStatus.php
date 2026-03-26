<?php

namespace App\Listeners;

use App\Events\WhatsAppAuthStatusChanged;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class HandleWhatsAppAuthStatus
{
    /**
     * Handle the event.
     */
    public function handle(WhatsAppAuthStatusChanged $event): void
    {
        $status = $event->status;
        $data = $event->data;

        // Store auth status in cache
        Cache::put('whatsapp:auth_status', $status, now()->addHours(24));
        Cache::put('whatsapp:auth_data', $data, now()->addHours(24));

        switch ($status) {
            case 'success':
                $this->handleAuthSuccess($data);
                break;

            case 'failure':
                $this->handleAuthFailure($data);
                break;
        }
    }

    /**
     * Handle successful authentication
     */
    private function handleAuthSuccess(array $data): void
    {
        Log::info('WhatsApp auth success', $data);

        // Store session info if available
        if (isset($data['sessionId'])) {
            Cache::put('whatsapp:session_id', $data['sessionId'], now()->addDays(30));
        }

        // Mark service as connected
        Cache::put('whatsapp:connected', true, now()->addHours(1));
    }

    /**
     * Handle authentication failure
     */
    private function handleAuthFailure(array $data): void
    {
        Log::error('WhatsApp auth failure', $data);

        // Clear session data
        Cache::forget('whatsapp:session_id');
        Cache::forget('whatsapp:connected');

        // Store failure reason
        if (isset($data['reason'])) {
            Cache::put('whatsapp:auth_failure_reason', $data['reason'], now()->addHour());
        }
    }
}
