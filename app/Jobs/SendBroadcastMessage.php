<?php

namespace App\Jobs;

use App\Models\BroadcastLog;
use App\Services\BaileysService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendBroadcastMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 3600; // 1 hour max for large broadcasts

    private int $delayBetweenMessages = 2; // seconds between each message

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $broadcastId
    ) {
        $this->onQueue(config('queue.queues.broadcast', 'default'));
    }

    /**
     * Execute the job.
     */
    public function handle(BaileysService $baileys): void
    {
        $broadcast = BroadcastLog::find($this->broadcastId);

        if (! $broadcast) {
            Log::error('Broadcast not found', ['broadcast_id' => $this->broadcastId]);

            return;
        }

        // Skip if already processed
        if (in_array($broadcast->status, ['completed', 'failed'])) {
            Log::info('Broadcast already processed', [
                'broadcast_id' => $broadcast->id,
                'status' => $broadcast->status,
            ]);

            return;
        }

        Log::info('Starting broadcast processing', [
            'broadcast_id' => $broadcast->id,
            'total_recipients' => $broadcast->total_recipients,
        ]);

        $broadcast->markAsProcessing();

        try {
            // Check WhatsApp connection first
            if (! $baileys->isConnected()) {
                throw new \Exception('WhatsApp tidak terkoneksi. Silakan cek koneksi terlebih dahulu.');
            }

            $recipients = $broadcast->recipients ?? [];
            $message = $broadcast->message;
            $baileysUrl = config('services.baileys.url', 'http://127.0.0.1:3002');

            foreach ($recipients as $index => $phone) {
                try {
                    // Format phone untuk WhatsApp JID
                    $jid = $this->formatJid($phone);

                    // Kirim via Baileys API
                    $response = Http::timeout(30)
                        ->post("{$baileysUrl}/messages/send", [
                            'to' => $jid,
                            'type' => 'text',
                            'content' => ['text' => $message],
                        ]);

                    if ($response->successful()) {
                        $broadcast->incrementSent();
                        Log::info('Broadcast message sent', [
                            'broadcast_id' => $broadcast->id,
                            'recipient' => $this->maskPhone($phone),
                            'progress' => ($index + 1).'/'.$broadcast->total_recipients,
                        ]);
                    } else {
                        $broadcast->incrementFailed($phone);
                        Log::warning('Broadcast failed to recipient', [
                            'broadcast_id' => $broadcast->id,
                            'recipient' => $this->maskPhone($phone),
                            'response' => $response->body(),
                        ]);
                    }
                } catch (\Exception $e) {
                    $broadcast->incrementFailed($phone);
                    Log::warning('Failed to send broadcast message', [
                        'broadcast_id' => $broadcast->id,
                        'recipient' => $this->maskPhone($phone),
                        'error' => $e->getMessage(),
                    ]);
                }

                // Delay between messages to avoid rate limiting
                if ($index < count($recipients) - 1) {
                    sleep($this->delayBetweenMessages);
                }
            }

            $broadcast->markAsCompleted();

            Log::info('Broadcast completed', [
                'broadcast_id' => $broadcast->id,
                'sent' => $broadcast->sent_count,
                'failed' => $broadcast->failed_count,
            ]);
        } catch (\Exception $e) {
            $broadcast->markAsFailed($e->getMessage());

            Log::error('Broadcast failed', [
                'broadcast_id' => $broadcast->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Format phone to WhatsApp JID
     */
    private function formatJid(string $phone): string
    {
        // Remove non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Convert 08xx to 628xx
        if (str_starts_with($phone, '0')) {
            $phone = '62'.substr($phone, 1);
        }

        // Add WhatsApp suffix if not present
        if (! str_contains($phone, '@')) {
            $phone .= '@s.whatsapp.net';
        }

        return $phone;
    }

    /**
     * Mask phone number for logging (privacy)
     */
    private function maskPhone(string $phone): string
    {
        $clean = preg_replace('/[^\d]/', '', $phone);
        if (strlen($clean) > 6) {
            return substr($clean, 0, 4).'****'.substr($clean, -4);
        }

        return '****'.substr($clean, -4);
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        $broadcast = BroadcastLog::find($this->broadcastId);

        if ($broadcast && $broadcast->status !== 'completed') {
            $broadcast->markAsFailed('Job failed: '.$exception->getMessage());
        }

        Log::error('SendBroadcastMessage job failed', [
            'broadcast_id' => $this->broadcastId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }

    /**
     * Get tags for monitoring
     */
    public function tags(): array
    {
        return [
            'broadcast',
            'broadcast_id:'.$this->broadcastId,
        ];
    }
}
