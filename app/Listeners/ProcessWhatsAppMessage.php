<?php

namespace App\Listeners;

use App\Events\WhatsAppMessageReceived;
use App\Models\Chat;
use App\Models\Message;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class ProcessWhatsAppMessage implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(WhatsAppMessageReceived $event): void
    {
        try {
            $data = $event->data;

            // Extract message info
            $fromNumber = $data['from'] ?? null;
            $messageText = $data['message']['conversation'] ?? null;
            $messageId = $data['messageId'] ?? null;

            if (! $fromNumber || ! $messageText) {
                Log::warning('WhatsApp message incomplete', $data);

                return;
            }

            // Clean phone number (remove @s.whatsapp.net)
            $phoneNumber = str_replace('@s.whatsapp.net', '', $fromNumber);

            // Find or create chat
            $chat = Chat::firstOrCreate([
                'phone_number' => $phoneNumber,
            ], [
                'name' => $data['pushName'] ?? 'Customer',
                'status' => 'active',
                'last_message_at' => now(),
            ]);

            // Store message
            Message::create([
                'chat_id' => $chat->id,
                'message_id' => $messageId,
                'from_number' => $phoneNumber,
                'message_type' => 'text',
                'content' => $messageText,
                'direction' => 'incoming',
                'status' => 'received',
                'metadata' => json_encode($data),
            ]);

            // Update chat last message
            $chat->update([
                'last_message' => $messageText,
                'last_message_at' => now(),
                'unread_count' => $chat->unread_count + 1,
            ]);

            Log::info('WhatsApp message processed', [
                'chat_id' => $chat->id,
                'from' => $phoneNumber,
                'message_preview' => substr($messageText, 0, 50).'...',
            ]);

        } catch (Exception $e) {
            Log::error('Error processing WhatsApp message', [
                'error' => $e->getMessage(),
                'data' => $event->data,
            ]);

            // Re-throw to trigger retry
            throw $e;
        }
    }
}
