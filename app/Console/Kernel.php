<?php

namespace App\Console;

use App\Events\WhatsAppDisconnected;
use App\Jobs\SendScheduledMessages;
use App\Services\BaileysService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Log;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ========================================
        // WHATSAPP AUTH-AWARE SCHEDULED TASKS
        // ========================================

        // Kirim pesan terjadwal - hanya jika WhatsApp connected
        $schedule->call(function () {
            $baileys = app(BaileysService::class);

            if (! $baileys->isConnected()) {
                Log::warning('Skipping scheduled WhatsApp messages - not connected');

                return;
            }

            // Dispatch job ke queue untuk processing
            SendScheduledMessages::dispatch();

            Log::info('Scheduled WhatsApp messages job dispatched');
        })
            ->everyMinute()
            ->name('send-wa-messages')
            ->withoutOverlapping()
            ->runInBackground()
            ->onFailure(function () {
                Log::error('Failed to dispatch scheduled WhatsApp messages');
            });

        // Health check WhatsApp connection - setiap 5 menit
        $schedule->call(function () {
            $baileys = app(BaileysService::class);
            $status = $baileys->getConnectionStatus();

            Log::debug('WhatsApp health check', ['status' => $status]);

            // Jika tidak connected, trigger event disconnect
            if (! $status['authenticated'] || $status['status'] !== 'open') {
                Log::warning('WhatsApp disconnected - triggering disconnect event', [
                    'status' => $status,
                ]);

                event(new WhatsAppDisconnected($status));
            }

            // Update health metrics
            $healthMetrics = $baileys->getHealthMetrics();
            cache()->put('whatsapp_health_score', $healthMetrics['health_score'], now()->addMinutes(10));

            // Jika health score rendah, log warning
            if ($healthMetrics['health_score'] < 70) {
                Log::warning('WhatsApp health score low', [
                    'score' => $healthMetrics['health_score'],
                    'metrics' => $healthMetrics,
                ]);
            }
        })
            ->everyFiveMinutes()
            ->name('baileys-health-check')
            ->withoutOverlapping();

        // Auto-restart jika stuck dalam status connecting > 10 menit
        $schedule->call(function () {
            $baileys = app(BaileysService::class);
            $status = $baileys->getConnectionStatus();

            if ($status['status'] === 'connecting') {
                $lastSeen = $status['last_seen'];
                if ($lastSeen && now()->diffInMinutes($lastSeen) > 10) {
                    Log::warning('WhatsApp stuck in connecting state - triggering restart', [
                        'last_seen' => $lastSeen,
                        'minutes_stuck' => now()->diffInMinutes($lastSeen),
                    ]);

                    $result = $baileys->restart();
                    Log::info('Auto-restart triggered', ['result' => $result]);
                }
            }
        })
            ->everyTenMinutes()
            ->name('baileys-auto-restart')
            ->withoutOverlapping();

        // ========================================
        // CLEANUP & MAINTENANCE TASKS
        // ========================================

        // Cleanup pesan terjadwal yang sudah lama failed
        $schedule->call(function () {
            $baileys = app(BaileysService::class);

            // Hanya cleanup jika WhatsApp connected untuk memastikan tidak ada race condition
            if (! $baileys->isConnected()) {
                Log::debug('Skipping scheduled message cleanup - WhatsApp not connected');

                return;
            }

            // Hapus pesan failed yang umurnya > 7 hari
            $deletedCount = \DB::table('scheduled_messages')
                ->where('status', 'failed')
                ->where('updated_at', '<', now()->subDays(7))
                ->delete();

            if ($deletedCount > 0) {
                Log::info('Cleaned up old failed scheduled messages', [
                    'deleted_count' => $deletedCount,
                ]);
            }

            // Reset retry count untuk pesan yang eligible untuk retry
            $resetCount = \DB::table('scheduled_messages')
                ->where('status', 'failed')
                ->where('retry_count', '>=', 3)
                ->where('updated_at', '<', now()->subHours(6)) // Tunggu 6 jam
                ->update([
                    'status' => 'pending',
                    'retry_count' => 0,
                    'scheduled_at' => now()->addMinutes(5),
                ]);

            if ($resetCount > 0) {
                Log::info('Reset retry count for eligible failed messages', [
                    'reset_count' => $resetCount,
                ]);
            }
        })
            ->hourly()
            ->name('cleanup-scheduled-messages')
            ->withoutOverlapping();

        // ========================================
        // MONITORING & ALERTS
        // ========================================

        // Generate daily WhatsApp usage report
        $schedule->call(function () {
            $baileys = app(BaileysService::class);

            // Hanya generate report jika WhatsApp pernah connected hari ini
            $healthMetrics = $baileys->getHealthMetrics();
            $messagesSent = $healthMetrics['messages_sent_today'] ?? 0;
            $messagesReceived = $healthMetrics['messages_received_today'] ?? 0;

            $report = [
                'date' => now()->toDateString(),
                'messages_sent' => $messagesSent,
                'messages_received' => $messagesReceived,
                'average_health_score' => cache()->get('whatsapp_daily_avg_health', 0),
                'total_disconnections' => cache()->get('whatsapp_disconnections_today', 0),
                'uptime_minutes' => $healthMetrics['uptime_minutes'] ?? 0,
            ];

            // Store di cache untuk dashboard
            cache()->put('whatsapp_daily_report', $report, now()->addDays(7));

            Log::info('Daily WhatsApp report generated', $report);

            // Reset daily counters
            cache()->forget('whatsapp_disconnections_today');

        })
            ->dailyAt('23:55')
            ->name('daily-wa-report')
            ->timezone('Asia/Jakarta');

        // ========================================
        // GENERAL SYSTEM TASKS
        // ========================================

        // Horizon metrics snapshot (jika menggunakan Laravel Horizon)
        $schedule->command('horizon:snapshot')
            ->everyFiveMinutes()
            ->onFailure(function () {
                Log::warning('Horizon snapshot failed');
            });

        // Clear expired cache
        $schedule->command('cache:prune-stale-tags')
            ->hourly()
            ->onFailure(function () {
                Log::warning('Cache pruning failed');
            });

        // Laravel Telescope cleanup (jika menggunakan Telescope)
        $schedule->command('telescope:prune')
            ->daily()
            ->onFailure(function () {
                Log::warning('Telescope pruning failed');
            });
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
