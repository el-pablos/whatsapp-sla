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

class SendWhatsAppMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60]; // Backoff strategy: 10s, 30s, 60s

    public int $timeout = 300; // 5 minutes timeout

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $to,
        public string $type,
        public array $content,
        public ?array $metadata = null
    ) {
        // Set queue berdasarkan prioritas
        $this->onQueue(config('queue.queues.whatsapp', 'whatsapp'));
    }

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsapp, BaileysService $baileys): void
    {
        Log::info('Processing WhatsApp message job', [
            'to' => $this->to,
            'type' => $this->type,
            'attempt' => $this->attempts(),
            'job_id' => $this->job->getJobId(),
        ]);

        // Check auth status first
        if (! $baileys->isConnected()) {
            $this->handleNotConnected($baileys);

            return;
        }

        try {
            $result = $this->sendMessage($whatsapp);

            if ($result['success']) {
                Log::info('WhatsApp message sent successfully', [
                    'to' => $this->to,
                    'type' => $this->type,
                    'message_id' => $result['data']['messages'][0]['id'] ?? null,
                    'attempts' => $this->attempts(),
                ]);

                // Increment success metrics
                $baileys->incrementMessageCounter('sent');
            } else {
                $this->handleSendFailure($result);
            }
        } catch (\Exception $e) {
            $this->handleException($e, $baileys);
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('WhatsApp message job failed permanently', [
            'to' => $this->to,
            'type' => $this->type,
            'attempts' => $this->attempts(),
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Record failure metrics
        app(BaileysService::class)->recordError(
            'Job failed permanently: '.$exception->getMessage(),
            [
                'to' => $this->to,
                'type' => $this->type,
                'attempts' => $this->attempts(),
            ]
        );

        // Optionally notify admin about permanent failure
        $this->notifyAdminOfFailure($exception);
    }

    /**
     * Send message berdasarkan type
     */
    private function sendMessage(WhatsAppService $whatsapp): array
    {
        return match ($this->type) {
            'text' => $whatsapp->sendText(
                $this->to,
                $this->content['text']
            ),
            'image' => $whatsapp->sendImage(
                $this->to,
                $this->content['url'],
                $this->content['caption'] ?? null
            ),
            'buttons' => $whatsapp->sendButtons(
                $this->to,
                $this->content['body'],
                $this->content['buttons']
            ),
            'list' => $whatsapp->sendList(
                $this->to,
                $this->content['body'],
                $this->content['button_text'],
                $this->content['sections']
            ),
            'document' => $whatsapp->sendDocument(
                $this->to,
                $this->content['url'],
                $this->content['filename'],
                $this->content['caption'] ?? null
            ),
            'template' => $whatsapp->sendTemplate(
                $this->to,
                $this->content['template_name'],
                $this->content['parameters'] ?? [],
                $this->content['language'] ?? 'id'
            ),
            default => throw new \InvalidArgumentException("Unknown message type: {$this->type}")
        };
    }

    /**
     * Handle ketika WhatsApp tidak terkoneksi
     */
    private function handleNotConnected(BaileysService $baileys): void
    {
        Log::warning('WhatsApp not connected, releasing job for retry', [
            'to' => $this->to,
            'type' => $this->type,
            'attempt' => $this->attempts(),
            'max_attempts' => $this->tries,
        ]);

        // Record error untuk monitoring
        $baileys->recordError('WhatsApp not connected during job processing', [
            'to' => $this->to,
            'type' => $this->type,
            'attempt' => $this->attempts(),
        ]);

        // Release job untuk retry dengan delay
        $delay = $this->calculateDelay();
        $this->release($delay);
    }

    /**
     * Handle send failure (bukan karena connection issue)
     */
    private function handleSendFailure(array $result): void
    {
        $error = $result['error'] ?? 'Unknown error';

        Log::error('WhatsApp message send failed', [
            'to' => $this->to,
            'type' => $this->type,
            'error' => $error,
            'attempt' => $this->attempts(),
            'result' => $result,
        ]);

        // Jika error rate limiting atau temporary error, retry
        if ($this->isRetryableError($error)) {
            $delay = $this->calculateDelay();
            $this->release($delay);
        } else {
            // Permanent error, fail the job
            throw new \Exception("Permanent error: {$error}");
        }
    }

    /**
     * Handle exception during processing
     */
    private function handleException(\Exception $e, BaileysService $baileys): void
    {
        Log::error('Exception during WhatsApp message processing', [
            'to' => $this->to,
            'type' => $this->type,
            'error' => $e->getMessage(),
            'attempt' => $this->attempts(),
            'trace' => $e->getTraceAsString(),
        ]);

        $baileys->recordError('Job exception: '.$e->getMessage(), [
            'to' => $this->to,
            'type' => $this->type,
            'attempt' => $this->attempts(),
        ]);

        // Re-throw untuk trigger standard Laravel retry logic
        throw $e;
    }

    /**
     * Calculate delay untuk retry
     */
    private function calculateDelay(): int
    {
        $attempt = $this->attempts();

        // Gunakan backoff array jika tersedia
        if (isset($this->backoff[$attempt - 1])) {
            return $this->backoff[$attempt - 1];
        }

        // Exponential backoff sebagai fallback
        return min(300, pow(2, $attempt) * 10); // Max 5 minutes
    }

    /**
     * Check apakah error bisa di-retry
     */
    private function isRetryableError(string $error): bool
    {
        $retryableErrors = [
            'rate limit',
            'temporarily unavailable',
            'service unavailable',
            'timeout',
            'connection error',
            'network error',
        ];

        foreach ($retryableErrors as $retryableError) {
            if (str_contains(strtolower($error), $retryableError)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Notify admin about permanent failure
     */
    private function notifyAdminOfFailure(\Throwable $exception): void
    {
        try {
            // Log ke channel khusus untuk admin monitoring
            Log::channel('slack')->error('WhatsApp message job failed permanently', [
                'to' => $this->to,
                'type' => $this->type,
                'error' => $exception->getMessage(),
                'attempts' => $this->attempts(),
                'metadata' => $this->metadata,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify admin of job failure', [
                'original_error' => $exception->getMessage(),
                'notification_error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get job tags untuk monitoring
     */
    public function tags(): array
    {
        return [
            'whatsapp',
            'message:'.$this->type,
            'to:'.substr($this->to, -4), // Last 4 digits untuk privacy
        ];
    }

    /**
     * Set job retry until untuk avoid infinite retry
     */
    public function retryUntil(): \DateTime
    {
        return now()->addHours(2); // Max retry selama 2 jam
    }

    /**
     * Handle job timeout
     */
    public function timeoutAt(): \DateTime
    {
        return now()->addMinutes(10); // Job timeout setelah 10 menit
    }

    /**
     * Factory methods untuk membuat job dengan mudah
     */
    public static function text(string $to, string $text, ?array $metadata = null): self
    {
        return new self($to, 'text', ['text' => $text], $metadata);
    }

    public static function image(string $to, string $url, ?string $caption = null, ?array $metadata = null): self
    {
        return new self($to, 'image', compact('url', 'caption'), $metadata);
    }

    public static function buttons(string $to, string $body, array $buttons, ?array $metadata = null): self
    {
        return new self($to, 'buttons', compact('body', 'buttons'), $metadata);
    }

    public static function list(string $to, string $body, string $buttonText, array $sections, ?array $metadata = null): self
    {
        return new self($to, 'list', compact('body', 'buttonText', 'sections'), $metadata);
    }

    public static function document(string $to, string $url, string $filename, ?string $caption = null, ?array $metadata = null): self
    {
        return new self($to, 'document', compact('url', 'filename', 'caption'), $metadata);
    }

    public static function template(string $to, string $templateName, array $parameters = [], string $language = 'id', ?array $metadata = null): self
    {
        return new self($to, 'template', compact('templateName', 'parameters', 'language'), $metadata);
    }
}
