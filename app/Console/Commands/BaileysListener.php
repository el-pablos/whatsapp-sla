<?php

namespace App\Console\Commands;

use App\Events\WhatsAppAuthStatusChanged;
use App\Events\WhatsAppConnectionStatusChanged;
use App\Events\WhatsAppMessageReceived;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class BaileysListener extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'baileys:listen {--timeout=0 : Timeout dalam detik (0 = tanpa timeout)}';

    /**
     * The console command description.
     */
    protected $description = 'Listen untuk Baileys events via Redis pubsub';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $timeout = (int) $this->option('timeout');

        $this->info('🚀 Memulai Baileys Event Listener...');
        $this->info('   Redis Host: '.config('database.redis.default.host'));
        $this->info('   Listening on channel: baileys:events');

        if ($timeout > 0) {
            $this->info("   Timeout: {$timeout} detik");
        } else {
            $this->info('   Mode: Continuous listening');
        }

        $this->newLine();

        try {
            // Setup Redis subscription
            $redis = Redis::connection();

            // Test koneksi
            $redis->ping();
            $this->info('✅ Koneksi Redis berhasil');

            // Subscribe ke channel
            $startTime = time();

            $redis->subscribe(['baileys:events'], function ($message, $channel) use ($startTime, $timeout) {
                try {
                    $data = json_decode($message, true);

                    if (! $data || ! isset($data['event'])) {
                        $this->warn("⚠️  Event tidak valid: {$message}");

                        return;
                    }

                    $this->info("📨 Event diterima: {$data['event']} ".now()->format('H:i:s'));

                    // Handle berdasarkan event type
                    match ($data['event']) {
                        'message:received' => $this->handleMessage($data['data'] ?? []),
                        'auth:success' => $this->handleAuthSuccess($data['data'] ?? []),
                        'auth:failure' => $this->handleAuthFailure($data['data'] ?? []),
                        'connection:status' => $this->handleConnectionStatus($data['data'] ?? []),
                        'qr:generated' => $this->handleQRGenerated($data['data'] ?? []),
                        default => $this->warn("   ⚠️  Unknown event: {$data['event']}")
                    };

                    // Check timeout
                    if ($timeout > 0 && (time() - $startTime) >= $timeout) {
                        $this->info('⏰ Timeout reached, stopping listener...');

                        return false; // Stop subscription
                    }

                } catch (Exception $e) {
                    $this->error('❌ Error handling event: '.$e->getMessage());
                }
            });

        } catch (Exception $e) {
            $this->error('❌ Error Redis connection: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('✅ Baileys Listener stopped gracefully');

        return self::SUCCESS;
    }

    /**
     * Handle message received event
     */
    private function handleMessage(array $data): void
    {
        try {
            $this->info('   📥 Processing message...');

            // Log basic message info
            if (isset($data['from'])) {
                $this->line("   From: {$data['from']}");
            }
            if (isset($data['message']['conversation'])) {
                $content = substr($data['message']['conversation'], 0, 50);
                $this->line("   Content: {$content}...");
            }

            // Dispatch Laravel event
            event(new WhatsAppMessageReceived($data));
            $this->info('   ✅ Event WhatsAppMessageReceived dispatched');

        } catch (Exception $e) {
            $this->error('   ❌ Error handling message: '.$e->getMessage());
        }
    }

    /**
     * Handle auth success event
     */
    private function handleAuthSuccess(array $data): void
    {
        try {
            $this->info('   🔐 Auth success...');

            // Dispatch Laravel event
            event(new WhatsAppAuthStatusChanged('success', $data));
            $this->info('   ✅ Event WhatsAppAuthStatusChanged (success) dispatched');

        } catch (Exception $e) {
            $this->error('   ❌ Error handling auth success: '.$e->getMessage());
        }
    }

    /**
     * Handle auth failure event
     */
    private function handleAuthFailure(array $data): void
    {
        try {
            $this->error('   🚫 Auth failure...');

            // Dispatch Laravel event
            event(new WhatsAppAuthStatusChanged('failure', $data));
            $this->error('   ✅ Event WhatsAppAuthStatusChanged (failure) dispatched');

        } catch (Exception $e) {
            $this->error('   ❌ Error handling auth failure: '.$e->getMessage());
        }
    }

    /**
     * Handle connection status change
     */
    private function handleConnectionStatus(array $data): void
    {
        try {
            $status = $data['status'] ?? 'unknown';
            $this->info("   🔗 Connection status: {$status}");

            // Dispatch Laravel event
            event(new WhatsAppConnectionStatusChanged($status, $data));
            $this->info('   ✅ Event WhatsAppConnectionStatusChanged dispatched');

        } catch (Exception $e) {
            $this->error('   ❌ Error handling connection status: '.$e->getMessage());
        }
    }

    /**
     * Handle QR code generated
     */
    private function handleQRGenerated(array $data): void
    {
        try {
            $this->info('   📱 QR Code generated...');

            if (isset($data['qr'])) {
                $this->line('   QR: '.substr($data['qr'], 0, 30).'...');
            }

            // Could create specific event for QR if needed
            // event(new WhatsAppQRGenerated($data));

        } catch (Exception $e) {
            $this->error('   ❌ Error handling QR generation: '.$e->getMessage());
        }
    }
}
