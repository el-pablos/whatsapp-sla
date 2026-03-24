<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class WebhookController extends Controller
{
    /**
     * Verify webhook endpoint for WhatsApp Business API
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function verify(Request $request)
    {
        $verifyToken = config('services.whatsapp.verify_token');

        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('Webhook verified successfully');
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('Webhook verification failed', [
            'mode' => $mode,
            'token_match' => $token === $verifyToken,
        ]);

        return response('Forbidden', 403);
    }

    /**
     * Handle incoming WhatsApp messages
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function receive(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('Webhook received', ['payload' => $payload]);

        // Validate payload structure
        if (!isset($payload['entry'][0]['changes'][0]['value'])) {
            return response()->json(['status' => 'ignored'], 200);
        }

        $value = $payload['entry'][0]['changes'][0]['value'];

        // Skip status updates (only process messages)
        if (!isset($value['messages'])) {
            return response()->json(['status' => 'no_messages'], 200);
        }

        $messages = $value['messages'];
        $contacts = $value['contacts'] ?? [];

        foreach ($messages as $message) {
            $this->processMessage($message, $contacts);
        }

        return response()->json(['status' => 'processed'], 200);
    }

    /**
     * Process individual WhatsApp message
     *
     * @param array $message
     * @param array $contacts
     * @return void
     */
    protected function processMessage(array $message, array $contacts): void
    {
        $messageId = $message['id'] ?? null;
        $from = $message['from'] ?? null;
        $type = $message['type'] ?? 'text';

        // Get contact name
        $contactName = null;
        foreach ($contacts as $contact) {
            if (($contact['wa_id'] ?? null) === $from) {
                $contactName = $contact['profile']['name'] ?? null;
                break;
            }
        }

        // Parse message content based on type
        $content = $this->parseMessageContent($message, $type);

        // Map WhatsApp type to our Message type constants
        $messageType = $this->mapMessageType($type);

        DB::transaction(function () use ($from, $contactName, $messageId, $messageType, $content) {
            // Find or create chat for this customer
            $chat = Chat::firstOrCreate(
                ['customer_phone' => $from],
                [
                    'whatsapp_chat_id' => $from,
                    'customer_name' => $contactName,
                    'status' => Chat::STATUS_BOT,
                    'last_message_at' => now(),
                ]
            );

            // Update chat with latest info
            $chat->update([
                'customer_name' => $contactName ?? $chat->customer_name,
                'last_message_at' => now(),
            ]);

            // Store message
            $storedMessage = Message::create([
                'chat_id' => $chat->id,
                'wa_message_id' => $messageId,
                'type' => $messageType,
                'content' => json_encode($content),
                'direction' => Message::DIRECTION_IN,
            ]);

            // Trigger Redis notification
            $this->notifyViaRedis($storedMessage, $chat);
        });

        Log::info('Message processed', [
            'message_id' => $messageId,
            'from' => $from,
            'type' => $type,
        ]);
    }

    /**
     * Map WhatsApp message type to our Message type constant
     *
     * @param string $waType
     * @return string
     */
    protected function mapMessageType(string $waType): string
    {
        return match ($waType) {
            'text' => Message::TYPE_TEXT,
            'image', 'video', 'audio', 'document', 'sticker' => Message::TYPE_IMAGE,
            'button' => Message::TYPE_BUTTON,
            'interactive' => Message::TYPE_LIST,
            default => Message::TYPE_TEXT,
        };
    }

    /**
     * Parse message content based on type
     *
     * @param array $message
     * @param string $type
     * @return array
     */
    protected function parseMessageContent(array $message, string $type): array
    {
        return match ($type) {
            'text' => $this->parseTextMessage($message),
            'button' => $this->parseButtonReply($message),
            'interactive' => $this->parseInteractiveReply($message),
            'image' => $this->parseImageMessage($message),
            'document' => $this->parseDocumentMessage($message),
            'audio' => $this->parseAudioMessage($message),
            'video' => $this->parseVideoMessage($message),
            'location' => $this->parseLocationMessage($message),
            'contacts' => $this->parseContactMessage($message),
            'sticker' => $this->parseStickerMessage($message),
            default => ['raw' => $message],
        };
    }

    /**
     * Parse text message
     */
    protected function parseTextMessage(array $message): array
    {
        return [
            'body' => $message['text']['body'] ?? '',
        ];
    }

    /**
     * Parse button reply (quick reply buttons)
     */
    protected function parseButtonReply(array $message): array
    {
        return [
            'button_id' => $message['button']['payload'] ?? '',
            'button_text' => $message['button']['text'] ?? '',
        ];
    }

    /**
     * Parse interactive reply (list or button)
     */
    protected function parseInteractiveReply(array $message): array
    {
        $interactive = $message['interactive'] ?? [];
        $interactiveType = $interactive['type'] ?? 'unknown';

        if ($interactiveType === 'button_reply') {
            return [
                'interactive_type' => 'button_reply',
                'button_id' => $interactive['button_reply']['id'] ?? '',
                'button_title' => $interactive['button_reply']['title'] ?? '',
            ];
        }

        if ($interactiveType === 'list_reply') {
            return [
                'interactive_type' => 'list_reply',
                'list_id' => $interactive['list_reply']['id'] ?? '',
                'list_title' => $interactive['list_reply']['title'] ?? '',
                'list_description' => $interactive['list_reply']['description'] ?? '',
            ];
        }

        return ['interactive_type' => $interactiveType, 'raw' => $interactive];
    }

    /**
     * Parse image message
     */
    protected function parseImageMessage(array $message): array
    {
        $image = $message['image'] ?? [];
        return [
            'media_id' => $image['id'] ?? '',
            'mime_type' => $image['mime_type'] ?? '',
            'sha256' => $image['sha256'] ?? '',
            'caption' => $image['caption'] ?? '',
        ];
    }

    /**
     * Parse document message
     */
    protected function parseDocumentMessage(array $message): array
    {
        $document = $message['document'] ?? [];
        return [
            'media_id' => $document['id'] ?? '',
            'mime_type' => $document['mime_type'] ?? '',
            'sha256' => $document['sha256'] ?? '',
            'filename' => $document['filename'] ?? '',
            'caption' => $document['caption'] ?? '',
        ];
    }

    /**
     * Parse audio message
     */
    protected function parseAudioMessage(array $message): array
    {
        $audio = $message['audio'] ?? [];
        return [
            'media_id' => $audio['id'] ?? '',
            'mime_type' => $audio['mime_type'] ?? '',
            'voice' => $audio['voice'] ?? false,
        ];
    }

    /**
     * Parse video message
     */
    protected function parseVideoMessage(array $message): array
    {
        $video = $message['video'] ?? [];
        return [
            'media_id' => $video['id'] ?? '',
            'mime_type' => $video['mime_type'] ?? '',
            'sha256' => $video['sha256'] ?? '',
            'caption' => $video['caption'] ?? '',
        ];
    }

    /**
     * Parse location message
     */
    protected function parseLocationMessage(array $message): array
    {
        $location = $message['location'] ?? [];
        return [
            'latitude' => $location['latitude'] ?? 0,
            'longitude' => $location['longitude'] ?? 0,
            'name' => $location['name'] ?? '',
            'address' => $location['address'] ?? '',
        ];
    }

    /**
     * Parse contact message
     */
    protected function parseContactMessage(array $message): array
    {
        return [
            'contacts' => $message['contacts'] ?? [],
        ];
    }

    /**
     * Parse sticker message
     */
    protected function parseStickerMessage(array $message): array
    {
        $sticker = $message['sticker'] ?? [];
        return [
            'media_id' => $sticker['id'] ?? '',
            'mime_type' => $sticker['mime_type'] ?? '',
            'sha256' => $sticker['sha256'] ?? '',
            'animated' => $sticker['animated'] ?? false,
        ];
    }

    /**
     * Notify via Redis for real-time updates
     *
     * @param Message $message
     * @param Chat $chat
     * @return void
     */
    protected function notifyViaRedis(Message $message, Chat $chat): void
    {
        try {
            $channel = 'whatsapp:incoming_message';
            $payload = json_encode([
                'event' => 'new_message',
                'data' => [
                    'id' => $message->id,
                    'chat_id' => $chat->id,
                    'wa_message_id' => $message->wa_message_id,
                    'customer_phone' => $chat->customer_phone,
                    'customer_name' => $chat->customer_name,
                    'type' => $message->type,
                    'content' => $message->content,
                    'direction' => $message->direction,
                    'created_at' => $message->created_at->toIso8601String(),
                ],
            ]);

            Redis::publish($channel, $payload);

            Log::info('Redis notification sent', ['channel' => $channel]);
        } catch (\Exception $e) {
            Log::error('Failed to send Redis notification', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
