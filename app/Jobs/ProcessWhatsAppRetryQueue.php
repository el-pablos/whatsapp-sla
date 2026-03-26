<?php

namespace App\Jobs;

use App\Services\BaileysService;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessWhatsAppRetryQueue implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1; // Only try once

    public int $timeout = 600; // 10 minutes timeout untuk process queue

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        $this->onQueue(config('queue.queues.whatsapp', 'whatsapp'));
    }

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsapp, BaileysService $baileys): void
    {
        Log::info('Starting to process WhatsApp retry queue');

        // Check if WhatsApp is connected
        if (! $baileys->isConnected()) {
            Log::warning('WhatsApp not connected, skipping retry queue processing');

            return;
        }

        try {
            $result = $whatsapp->processRetryQueue();

            Log::info('WhatsApp retry queue processed', [
                'processed' => $result['processed'],
                'failed' => $result['failed'],
                'remaining' => $result['remaining_queue'],
            ]);

            // Jika masih ada message yang tersisa dan belum terlalu banyak yang gagal
            if ($result['remaining_queue'] > 0 && $result['failed'] < 10) {
                // Schedule another retry processing job dengan delay
                Log::info('Scheduling another retry queue processing job');
                self::dispatch()->delay(now()->addMinutes(2));
            }
        } catch (\Exception $e) {
            Log::error('Failed to process WhatsApp retry queue', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $baileys->recordError('Retry queue processing failed: '.$e->getMessage());
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('WhatsApp retry queue processing job failed', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }

    /**
     * Get job tags for monitoring
     */
    public function tags(): array
    {
        return ['whatsapp', 'retry-queue'];
    }
}
