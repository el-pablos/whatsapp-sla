<?php

namespace App\Console\Commands;

use App\Services\WhatsAppStatusService;
use Illuminate\Console\Command;

class TestBaileysEvents extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'baileys:test {event? : Event type to test}';

    /**
     * The console command description.
     */
    protected $description = 'Send test events to Baileys listener untuk testing';

    /**
     * Execute the console command.
     */
    public function handle(WhatsAppStatusService $statusService): int
    {
        $event = $this->argument('event');

        if (! $event) {
            $event = $this->choice(
                'Pilih event untuk test:',
                ['message:received', 'auth:success', 'auth:failure', 'connection:status', 'qr:generated'],
                0
            );
        }

        $this->info("Sending test event: {$event}");

        $success = match ($event) {
            'message:received' => $this->testMessage($statusService),
            'auth:success' => $this->testAuthSuccess($statusService),
            'auth:failure' => $this->testAuthFailure($statusService),
            'connection:status' => $this->testConnectionStatus($statusService),
            'qr:generated' => $this->testQRGenerated($statusService),
            default => $this->error("Unknown event: {$event}")
        };

        if ($success) {
            $this->info('✅ Test event sent successfully!');
            $this->line("Run 'php artisan baileys:listen --timeout=30' to see the event processing.");

            return self::SUCCESS;
        }

        return self::FAILURE;
    }

    /**
     * Test message received event
     */
    private function testMessage(WhatsAppStatusService $statusService): bool
    {
        return $statusService->sendTestEvent('message:received', [
            'messageId' => 'test_'.uniqid(),
            'from' => '628123456789@s.whatsapp.net',
            'pushName' => 'Test Customer',
            'message' => [
                'conversation' => 'Halo, saya ingin pesan ayam petelur 10 ekor',
            ],
            'timestamp' => time(),
        ]);
    }

    /**
     * Test auth success event
     */
    private function testAuthSuccess(WhatsAppStatusService $statusService): bool
    {
        return $statusService->sendTestEvent('auth:success', [
            'sessionId' => 'test_session_'.uniqid(),
            'userId' => '628123456789',
            'deviceId' => 'test_device_001',
        ]);
    }

    /**
     * Test auth failure event
     */
    private function testAuthFailure(WhatsAppStatusService $statusService): bool
    {
        return $statusService->sendTestEvent('auth:failure', [
            'reason' => 'Invalid session',
            'code' => 401,
            'details' => 'Session expired or invalid',
        ]);
    }

    /**
     * Test connection status event
     */
    private function testConnectionStatus(WhatsAppStatusService $statusService): bool
    {
        $status = $this->choice('Connection status:', ['open', 'close', 'connecting'], 0);

        return $statusService->sendTestEvent('connection:status', [
            'status' => $status,
            'reason' => $status === 'close' ? 'logged out' : null,
        ]);
    }

    /**
     * Test QR generated event
     */
    private function testQRGenerated(WhatsAppStatusService $statusService): bool
    {
        return $statusService->sendTestEvent('qr:generated', [
            'qr' => 'test_qr_code_'.base64_encode(random_bytes(32)),
        ]);
    }
}
