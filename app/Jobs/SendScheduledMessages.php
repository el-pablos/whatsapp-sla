<?php

namespace App\Jobs;

use App\Models\ScheduledMessage;
use App\Services\BaileysService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job untuk mengirim pesan WhatsApp terjadwal
 */
class SendScheduledMessages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public int $timeout = 120;

    /**
     * Execute the job.
     */
    public function handle(BaileysService $baileys): void
    {
        Log::info('Memulai pengiriman pesan terjadwal');

        // Cek apakah scheduled messages di-pause
        if (cache()->get('whatsapp_scheduled_messages_paused', false)) {
            Log::info('Scheduled messages sedang di-pause, skip pengiriman');

            return;
        }

        // Ambil pesan yang siap dikirim
        $messages = ScheduledMessage::query()
            ->where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->orderBy('scheduled_at')
            ->limit(50) // Batasi agar tidak overload
            ->get();

        if ($messages->isEmpty()) {
            Log::debug('Tidak ada pesan terjadwal untuk dikirim');

            return;
        }

        Log::info('Ditemukan pesan terjadwal', ['count' => $messages->count()]);

        foreach ($messages as $message) {
            $this->sendMessage($baileys, $message);
        }

        Log::info('Selesai mengirim pesan terjadwal');
    }

    /**
     * Kirim satu pesan terjadwal
     */
    private function sendMessage(BaileysService $baileys, ScheduledMessage $message): void
    {
        try {
            // Update status jadi processing
            $message->update(['status' => 'processing']);

            // Kirim pesan via Baileys
            $result = $baileys->sendMessage($message->phone_number, $message->message);

            if ($result['success']) {
                // Berhasil
                $message->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'response_data' => $result['data'] ?? null,
                ]);

                Log::info('Pesan terjadwal berhasil dikirim', [
                    'message_id' => $message->id,
                    'phone' => $message->phone_number,
                ]);
            } else {
                // Gagal
                $message->update([
                    'status' => 'failed',
                    'error_message' => $result['error'] ?? 'Unknown error',
                    'retry_count' => $message->retry_count + 1,
                ]);

                Log::warning('Pesan terjadwal gagal dikirim', [
                    'message_id' => $message->id,
                    'phone' => $message->phone_number,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                // Retry jika belum mencapai max retry
                if ($message->retry_count < 3) {
                    $this->scheduleRetry($message);
                }
            }
        } catch (\Exception $e) {
            Log::error('Exception saat mengirim pesan terjadwal', [
                'message_id' => $message->id,
                'exception' => $e->getMessage(),
            ]);

            $message->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'retry_count' => $message->retry_count + 1,
            ]);
        }
    }

    /**
     * Jadwalkan retry untuk pesan yang gagal
     */
    private function scheduleRetry(ScheduledMessage $message): void
    {
        $retryDelay = [60, 300, 900][$message->retry_count - 1] ?? 900; // 1min, 5min, 15min

        $message->update([
            'status' => 'pending',
            'scheduled_at' => now()->addSeconds($retryDelay),
        ]);

        Log::info('Pesan dijadwalkan retry', [
            'message_id' => $message->id,
            'retry_at' => now()->addSeconds($retryDelay),
            'retry_count' => $message->retry_count,
        ]);
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('SendScheduledMessages job gagal total', [
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
