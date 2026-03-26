<?php

namespace App\Listeners;

use App\Events\WhatsAppDisconnected;
use App\Services\BaileysService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Listener untuk menangani event WhatsApp disconnect
 */
class HandleWhatsAppDisconnected implements ShouldQueue
{
    public string $queue = 'notifications';

    /**
     * Handle the event.
     */
    public function handle(WhatsAppDisconnected $event): void
    {
        $status = $event->status;
        $disconnectedAt = $event->disconnectedAt;

        Log::warning('WhatsApp disconnected - handling event', [
            'status' => $status,
            'disconnected_at' => $disconnectedAt,
        ]);

        // Increment disconnect counter untuk daily report
        $currentCount = Cache::get('whatsapp_disconnections_today', 0);
        Cache::put('whatsapp_disconnections_today', $currentCount + 1, now()->endOfDay());

        // Record disconnect event di cache untuk monitoring
        $this->recordDisconnectEvent($status, $disconnectedAt);

        // Update health score ke 0
        Cache::put('whatsapp_health_score', 0, now()->addMinutes(10));

        // Jika error adalah timeout atau connection issue, coba auto-reconnect
        if ($this->shouldAutoReconnect($status)) {
            $this->attemptAutoReconnect();
        }

        // Notify admin jika disconnect terlalu sering
        if ($this->isFrequentDisconnect()) {
            $this->notifyAdminFrequentDisconnects($status);
        }

        // Pause scheduled messages jika perlu
        $this->pauseScheduledMessagesIfNeeded($status);
    }

    /**
     * Record disconnect event untuk monitoring
     */
    private function recordDisconnectEvent(array $status, $disconnectedAt): void
    {
        try {
            $disconnectHistory = Cache::get('whatsapp_disconnect_history', []);

            $disconnectHistory[] = [
                'timestamp' => $disconnectedAt,
                'status' => $status,
                'reason' => $status['error'] ?? 'Unknown',
            ];

            // Keep only last 50 disconnects
            if (count($disconnectHistory) > 50) {
                $disconnectHistory = array_slice($disconnectHistory, -50);
            }

            Cache::put('whatsapp_disconnect_history', $disconnectHistory, now()->addDays(7));

            Log::info('Disconnect event recorded', [
                'total_events' => count($disconnectHistory),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to record disconnect event', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check apakah perlu auto-reconnect berdasarkan status
     */
    private function shouldAutoReconnect(array $status): bool
    {
        $errorMessages = [
            'connection timeout',
            'websocket closed',
            'network error',
            'connection lost',
        ];

        $reason = strtolower($status['error'] ?? '');

        foreach ($errorMessages as $errorMsg) {
            if (str_contains($reason, $errorMsg)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Attempt auto-reconnect dengan backoff
     */
    private function attemptAutoReconnect(): void
    {
        try {
            $reconnectAttempts = Cache::get('whatsapp_reconnect_attempts', 0);

            // Max 5 attempts dalam 1 jam
            if ($reconnectAttempts >= 5) {
                Log::warning('Max reconnect attempts reached, skipping auto-reconnect');

                return;
            }

            // Exponential backoff: 30s, 60s, 120s, 240s, 480s
            $delay = min(30 * pow(2, $reconnectAttempts), 480);

            Log::info('Scheduling auto-reconnect', [
                'attempt' => $reconnectAttempts + 1,
                'delay_seconds' => $delay,
            ]);

            // Schedule reconnect dengan delay
            dispatch(function () use ($reconnectAttempts) {
                $baileys = app(BaileysService::class);
                $result = $baileys->restart();

                Cache::put('whatsapp_reconnect_attempts', $reconnectAttempts + 1, now()->addHour());

                Log::info('Auto-reconnect attempted', [
                    'result' => $result,
                    'attempt' => $reconnectAttempts + 1,
                ]);
            })->delay(now()->addSeconds($delay));

        } catch (\Exception $e) {
            Log::error('Failed to schedule auto-reconnect', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check apakah disconnect terlalu sering
     */
    private function isFrequentDisconnect(): bool
    {
        $disconnectHistory = Cache::get('whatsapp_disconnect_history', []);

        // Check jika ada 5+ disconnect dalam 1 jam terakhir
        $recentDisconnects = array_filter($disconnectHistory, function ($event) {
            return now()->diffInMinutes($event['timestamp']) <= 60;
        });

        return count($recentDisconnects) >= 5;
    }

    /**
     * Notify admin tentang frequent disconnects
     */
    private function notifyAdminFrequentDisconnects(array $status): void
    {
        try {
            $lastNotification = Cache::get('whatsapp_admin_notification_sent');

            // Jangan spam notifikasi - minimal 1 jam sekali
            if ($lastNotification && now()->diffInMinutes($lastNotification) < 60) {
                return;
            }

            Log::critical('Frequent WhatsApp disconnects detected', [
                'status' => $status,
                'action' => 'Admin notification sent',
            ]);

            // Mark bahwa notification sudah dikirim
            Cache::put('whatsapp_admin_notification_sent', now(), now()->addHour());

            // TODO: Implement actual notification (email, Slack, etc.)
            // Notification::send($adminUsers, new FrequentWhatsAppDisconnectsNotification($status));

        } catch (\Exception $e) {
            Log::error('Failed to notify admin about frequent disconnects', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Pause scheduled messages jika disconnect berkepanjangan
     */
    private function pauseScheduledMessagesIfNeeded(array $status): void
    {
        try {
            $disconnectHistory = Cache::get('whatsapp_disconnect_history', []);

            // Jika ada 3+ disconnect dalam 30 menit, pause scheduled messages
            $recentDisconnects = array_filter($disconnectHistory, function ($event) {
                return now()->diffInMinutes($event['timestamp']) <= 30;
            });

            if (count($recentDisconnects) >= 3) {
                Cache::put('whatsapp_scheduled_messages_paused', true, now()->addHours(2));

                Log::warning('Scheduled messages paused due to frequent disconnects', [
                    'recent_disconnects' => count($recentDisconnects),
                    'paused_until' => now()->addHours(2),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to pause scheduled messages', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle failed listener execution
     */
    public function failed(WhatsAppDisconnected $event, \Throwable $exception): void
    {
        Log::error('HandleWhatsAppDisconnected listener failed', [
            'event' => get_class($event),
            'status' => $event->status,
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
