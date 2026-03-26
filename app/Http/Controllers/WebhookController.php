<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class WebhookController extends Controller
{
    /**
     * Verify webhook endpoint for WhatsApp Business API
     *
     * @return Response
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
     */
    public function receive(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('Webhook received', ['payload' => $payload]);

        // Validate payload structure
        if (! isset($payload['entry'][0]['changes'][0]['value'])) {
            Log::debug('Webhook ignored: invalid payload structure');

            return response()->json(['status' => 'ignored'], 200);
        }

        $value = $payload['entry'][0]['changes'][0]['value'];

        // Skip status updates (only process messages)
        if (! isset($value['messages'])) {
            Log::debug('Webhook skipped: no messages in payload (status update)');

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
     */
    protected function processMessage(array $message, array $contacts): void
    {
        $messageId = $message['id'] ?? null;
        $from = $message['from'] ?? null;
        $type = $message['type'] ?? 'text';

        Log::info('Processing incoming message', [
            'message_id' => $messageId,
            'from' => $from,
            'type' => $type,
            'raw_message' => $message,
        ]);

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

        Log::info('Parsed message content', [
            'from' => $from,
            'type' => $type,
            'content' => $content,
        ]);

        // Map WhatsApp type to our Message type constants
        $messageType = $this->mapMessageType($type);

        $chat = null;
        $shouldAutoReply = false;

        try {
            DB::transaction(function () use ($from, $contactName, $messageId, $messageType, $content, &$chat, &$shouldAutoReply) {
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

                // Determine if auto-reply should be sent
                // Auto-reply hanya untuk chat yang BUKAN dalam mode ADMIN
                $shouldAutoReply = in_array($chat->status, [Chat::STATUS_BOT, Chat::STATUS_ACTIVE]);

                Log::info('Chat status check', [
                    'chat_id' => $chat->id,
                    'phone' => $from,
                    'status' => $chat->status,
                    'should_auto_reply' => $shouldAutoReply,
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
        } catch (\Exception $e) {
            Log::error('Failed to process message in transaction', [
                'error' => $e->getMessage(),
                'from' => $from,
                'message_id' => $messageId,
            ]);

            return;
        }

        Log::info('Message processed and stored', [
            'message_id' => $messageId,
            'from' => $from,
            'type' => $type,
            'chat_id' => $chat?->id,
            'chat_status' => $chat?->status,
            'should_auto_reply' => $shouldAutoReply,
        ]);

        // Auto-reply jika chat tidak dalam mode ADMIN
        if ($chat && $shouldAutoReply) {
            Log::info('Triggering auto-reply', ['phone' => $from, 'chat_status' => $chat->status]);
            $this->sendAutoReply($from, $content, $type);
        } else {
            Log::info('Auto-reply skipped', [
                'reason' => $chat ? "chat status is {$chat->status}" : 'chat is null',
                'phone' => $from,
            ]);
        }
    }

    /**
     * Map WhatsApp message type to our Message type constant
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

    /**
     * Send auto-reply based on message content
     * BUTTON-BASED: User memilih via tombol, bukan mengetik
     */
    protected function sendAutoReply(string $phone, array $content, string $type): void
    {
        try {
            $action = '';

            // Extract action from different message types
            if ($type === 'text') {
                $action = strtolower(trim($content['body'] ?? ''));
            } elseif ($type === 'interactive') {
                // Handle interactive button/list reply
                $interactiveType = $content['interactive_type'] ?? '';
                if ($interactiveType === 'button_reply') {
                    $action = strtolower($content['button_id'] ?? '');
                } elseif ($interactiveType === 'list_reply') {
                    $action = strtolower($content['list_id'] ?? '');
                } else {
                    $action = strtolower($content['button_id'] ?? $content['list_id'] ?? '');
                }
            } elseif ($type === 'button') {
                $action = strtolower($content['button_id'] ?? $content['button_text'] ?? '');
            }

            Log::info('Auto-reply processing', [
                'phone' => $phone,
                'type' => $type,
                'action' => $action,
                'content' => $content,
            ]);

            // Route based on button action
            switch ($action) {
                case 'btn_harga':
                case 'harga':
                case 'price':
                    $this->sendPriceList($phone);
                    break;

                case 'btn_stok':
                case 'stok':
                case 'stock':
                    $this->sendStockList($phone);
                    break;

                case 'btn_pesan':
                case 'pesan':
                case 'order':
                    $this->sendOrderInfo($phone);
                    break;

                case 'btn_katalog':
                case 'katalog':
                case 'catalog':
                    $this->sendCatalog($phone);
                    break;

                case 'btn_admin':
                case 'admin':
                case 'bantuan':
                case 'help':
                    $this->sendAdminContact($phone);
                    break;

                case 'btn_menu':
                case 'menu':
                case 'home':
                case 'start':
                case 'mulai':
                    $this->sendMainMenu($phone);
                    break;

                default:
                    // Untuk pesan pertama kali atau pesan random, tampilkan welcome + menu
                    $this->sendWelcomeMenu($phone);
                    break;
            }
        } catch (\Exception $e) {
            Log::error('Auto-reply failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'phone' => $phone,
            ]);
        }
    }

    /**
     * Send welcome message with main menu buttons
     * BUTTON-BASED: 3 tombol utama untuk navigasi cepat
     */
    protected function sendWelcomeMenu(string $phone): void
    {
        $message = "Halo! Selamat datang di *Ayam Petelur Farm* 🐔\n\n";
        $message .= "Kami menyediakan telur segar dan ayam berkualitas langsung dari peternakan.\n\n";
        $message .= 'Silakan pilih menu di bawah ini:';

        $this->sendWhatsAppButtons($phone, $message, [
            ['id' => 'btn_harga', 'title' => '💰 Lihat Harga'],
            ['id' => 'btn_stok', 'title' => '📦 Cek Stok'],
            ['id' => 'btn_admin', 'title' => '👤 Hubungi Admin'],
        ]);
    }

    /**
     * Send main menu with buttons
     */
    protected function sendMainMenu(string $phone): void
    {
        $message = "*MENU UTAMA*\n";
        $message .= "Ayam Petelur Farm 🐔\n";
        $message .= "====================\n\n";
        $message .= 'Pilih salah satu menu:';

        $this->sendWhatsAppButtons($phone, $message, [
            ['id' => 'btn_harga', 'title' => '💰 Lihat Harga'],
            ['id' => 'btn_stok', 'title' => '📦 Cek Stok'],
            ['id' => 'btn_admin', 'title' => '👤 Hubungi Admin'],
        ]);
    }

    /**
     * Send price list with buttons
     */
    protected function sendPriceList(string $phone): void
    {
        $products = Product::where('is_active', true)->get();

        $message = "*DAFTAR HARGA*\n";
        $message .= "Ayam Petelur Farm 🐔\n";
        $message .= "====================\n\n";

        if ($products->count() > 0) {
            foreach ($products as $product) {
                $message .= "🥚 *{$product->name}*\n";
                $message .= '   Rp '.number_format($product->price, 0, ',', '.')."/{$product->unit}\n\n";
            }
        } else {
            $message .= "🥚 *Telur Ayam Segar*\n";
            $message .= "   Rp 28.000/kg\n\n";
            $message .= "🥚 *Telur Ayam Omega*\n";
            $message .= "   Rp 35.000/kg\n\n";
            $message .= "🐔 *Ayam Potong Segar*\n";
            $message .= "   Rp 38.000/kg\n\n";
        }

        $message .= "_Harga dapat berubah sewaktu-waktu_\n";
        $message .= '_Update: '.now()->format('d/m/Y').'_';

        $this->sendWhatsAppButtons($phone, $message, [
            ['id' => 'btn_pesan', 'title' => 'Pesan Sekarang'],
            ['id' => 'btn_stok', 'title' => 'Cek Stok'],
            ['id' => 'btn_menu', 'title' => 'Menu Utama'],
        ]);
    }

    /**
     * Send stock list with buttons
     */
    protected function sendStockList(string $phone): void
    {
        $products = Product::where('is_active', true)->get();

        $message = "*KETERSEDIAAN STOK*\n";
        $message .= "Ayam Petelur Farm 🐔\n";
        $message .= "====================\n\n";

        if ($products->count() > 0) {
            foreach ($products as $product) {
                $status = $product->stock > 0 ? '✅' : '❌';
                $statusText = $product->stock > 0 ? 'Tersedia' : 'Habis';
                $message .= "{$status} *{$product->name}*\n";
                $message .= '   Stok: '.number_format($product->stock, 0, ',', '.')." {$product->unit}\n";
                $message .= "   Status: {$statusText}\n\n";
            }
        } else {
            $message .= "✅ *Telur Ayam Segar*\n";
            $message .= "   Stok: 500 kg - Tersedia\n\n";
            $message .= "✅ *Telur Ayam Omega*\n";
            $message .= "   Stok: 200 kg - Tersedia\n\n";
            $message .= "❌ *Ayam Kampung*\n";
            $message .= "   Stok: Habis\n\n";
        }

        $message .= '_Update: '.now()->format('d/m/Y H:i').'_';

        $this->sendWhatsAppButtons($phone, $message, [
            ['id' => 'btn_pesan', 'title' => 'Pesan Produk'],
            ['id' => 'btn_harga', 'title' => 'Lihat Harga'],
            ['id' => 'btn_menu', 'title' => 'Menu Utama'],
        ]);
    }

    /**
     * Send order info with buttons
     */
    protected function sendOrderInfo(string $phone): void
    {
        $message = "*CARA PEMESANAN*\n";
        $message .= "Ayam Petelur Farm 🐔\n";
        $message .= "====================\n\n";
        $message .= "Untuk memesan produk:\n\n";
        $message .= "1️⃣ Klik tombol *Hubungi Admin* di bawah\n\n";
        $message .= "2️⃣ Kirim format pesanan:\n";
        $message .= "   _Nama: [nama Anda]_\n";
        $message .= "   _Produk: [nama produk]_\n";
        $message .= "   _Jumlah: [qty] kg_\n";
        $message .= "   _Alamat: [alamat lengkap]_\n\n";
        $message .= 'Admin kami akan segera memproses pesanan Anda! 🚀';

        $this->sendWhatsAppButtons($phone, $message, [
            ['id' => 'btn_admin', 'title' => 'Hubungi Admin'],
            ['id' => 'btn_harga', 'title' => 'Lihat Harga'],
            ['id' => 'btn_menu', 'title' => 'Menu Utama'],
        ]);
    }

    /**
     * Send catalog with buttons
     */
    protected function sendCatalog(string $phone): void
    {
        $message = "*KATALOG PRODUK*\n";
        $message .= "Ayam Petelur Farm 🐔\n";
        $message .= "====================\n\n";
        $message .= "*TELUR AYAM*\n";
        $message .= "🥚 Telur Ayam Segar (Grade A)\n";
        $message .= "🥚 Telur Ayam Omega (Omega-3)\n\n";
        $message .= "*AYAM SEGAR*\n";
        $message .= "🐔 Ayam Potong Segar (1.2-1.5 kg)\n";
        $message .= "🐔 Ayam Kampung (0.8-1.2 kg)\n\n";
        $message .= "_Semua produk HALAL & tersertifikasi_\n";
        $message .= '_Langsung dari peternakan kami!_';

        $this->sendWhatsAppButtons($phone, $message, [
            ['id' => 'btn_harga', 'title' => 'Lihat Harga'],
            ['id' => 'btn_pesan', 'title' => 'Pesan Sekarang'],
            ['id' => 'btn_menu', 'title' => 'Menu Utama'],
        ]);
    }

    /**
     * Send admin contact with buttons
     * Juga update status chat ke ADMIN agar tidak auto-reply
     */
    protected function sendAdminContact(string $phone): void
    {
        // Update chat status ke ADMIN agar tidak auto-reply lagi
        $chat = Chat::where('customer_phone', $phone)->first();
        if ($chat) {
            $chat->update(['status' => Chat::STATUS_ADMIN]);
            Log::info('Chat transferred to admin', ['chat_id' => $chat->id, 'phone' => $phone]);
        }

        $message = "*CHAT DENGAN ADMIN*\n";
        $message .= "Ayam Petelur Farm 🐔\n";
        $message .= "====================\n\n";
        $message .= "Terima kasih telah menghubungi kami! 🙏\n\n";
        $message .= "Chat Anda telah diteruskan ke admin.\n";
        $message .= "Admin kami akan segera membalas.\n\n";
        $message .= "⏰ *Jam Operasional:*\n";
        $message .= "Senin - Sabtu: 07:00 - 17:00 WIB\n";
        $message .= "Minggu: Libur\n\n";
        $message .= "📱 *WhatsApp Admin:*\n";
        $message .= "0858-1737-8442\n\n";
        $message .= '_Silakan tunggu balasan dari admin._';

        $this->sendWhatsAppButtons($phone, $message, [
            ['id' => 'btn_katalog', 'title' => 'Lihat Katalog'],
            ['id' => 'btn_harga', 'title' => 'Lihat Harga'],
            ['id' => 'btn_menu', 'title' => 'Menu Utama'],
        ]);
    }

    /**
     * Send WhatsApp interactive buttons via queue job
     */
    protected function sendWhatsAppButtons(string $phone, string $body, array $buttons): void
    {
        Log::info('Queueing WhatsApp buttons message', [
            'phone' => $phone,
            'buttons_count' => count($buttons),
            'button_ids' => array_column($buttons, 'id'),
        ]);

        try {
            // Dispatch job untuk send buttons dengan auth awareness
            SendWhatsAppMessage::buttons($phone, $body, $buttons, [
                'source' => 'auto_reply',
                'queued_at' => now()->toISOString(),
            ])->dispatch();

            Log::info('WhatsApp buttons message queued successfully', [
                'phone' => $phone,
                'buttons_count' => count($buttons),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue WhatsApp buttons message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Send WhatsApp interactive list via queue job
     */
    protected function sendWhatsAppList(string $phone, string $body, string $buttonText, array $sections): void
    {
        Log::info('Queueing WhatsApp list message', [
            'phone' => $phone,
            'sections_count' => count($sections),
            'button_text' => $buttonText,
        ]);

        try {
            // Dispatch job untuk send list dengan auth awareness
            SendWhatsAppMessage::list($phone, $body, $buttonText, $sections, [
                'source' => 'auto_reply',
                'queued_at' => now()->toISOString(),
            ])->dispatch();

            Log::info('WhatsApp list message queued successfully', [
                'phone' => $phone,
                'sections_count' => count($sections),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue WhatsApp list message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send WhatsApp text message via queue job
     */
    protected function sendWhatsAppMessage(string $phone, string $message): void
    {
        Log::info('Queueing WhatsApp text message', [
            'phone' => $phone,
            'message_length' => strlen($message),
        ]);

        try {
            // Dispatch job untuk send text dengan auth awareness
            SendWhatsAppMessage::text($phone, $message, [
                'source' => 'auto_reply',
                'queued_at' => now()->toISOString(),
            ])->dispatch();

            Log::info('WhatsApp text message queued successfully', [
                'phone' => $phone,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to queue WhatsApp text message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
