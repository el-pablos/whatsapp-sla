<?php

namespace App\Http\Controllers;

use App\Http\Requests\MessageRequest;
use App\Http\Resources\ChatResource;
use App\Http\Resources\MessageResource;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Redis;

class ChatController extends Controller
{
    /**
     * List chats dengan filter status
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Chat::with(['customer', 'lastMessage'])
            ->withCount('messages');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by handler type (bot/admin)
        if ($request->has('handled_by')) {
            $query->where('handled_by', $request->handled_by);
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Search by customer name/phone
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('customer', function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        $chats = $query->orderByDesc('last_message_at')
            ->paginate($request->input('per_page', 20));

        return ChatResource::collection($chats);
    }

    /**
     * Chat detail dengan messages
     */
    public function show(int $id): ChatResource
    {
        $chat = Chat::with([
            'customer',
            'messages' => fn($q) => $q->orderBy('created_at'),
            'messages.attachments',
            'assignedAdmin',
        ])->findOrFail($id);

        return new ChatResource($chat);
    }

    /**
     * Admin ambil alih dari bot
     */
    public function takeover(int $id, Request $request): JsonResponse
    {
        $chat = Chat::findOrFail($id);

        if ($chat->handled_by === 'admin' && $chat->assigned_admin_id !== null) {
            return response()->json([
                'message' => 'Chat sudah dihandle oleh admin lain.',
                'assigned_to' => $chat->assignedAdmin?->name,
            ], 422);
        }

        $chat->update([
            'handled_by' => 'admin',
            'assigned_admin_id' => $request->user()->id,
            'takeover_at' => now(),
        ]);

        // Notify via Redis pub/sub
        $this->publishChatEvent('chat.takeover', [
            'chat_id' => $chat->id,
            'admin_id' => $request->user()->id,
            'admin_name' => $request->user()->name,
        ]);

        return response()->json([
            'message' => 'Berhasil mengambil alih chat.',
            'chat' => new ChatResource($chat->fresh(['customer', 'assignedAdmin'])),
        ]);
    }

    /**
     * Admin kirim message
     */
    public function sendMessage(int $id, MessageRequest $request): JsonResponse
    {
        $chat = Chat::findOrFail($id);

        // Pastikan admin yang assigned yang bisa kirim message
        if ($chat->handled_by === 'admin' && $chat->assigned_admin_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk mengirim pesan di chat ini.',
            ], 403);
        }

        // Buat message
        $message = $chat->messages()->create([
            'sender_type' => 'admin',
            'sender_id' => $request->user()->id,
            'content' => $request->content,
            'message_type' => $request->input('message_type', 'text'),
        ]);

        // Handle attachments jika ada
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('chat-attachments', 'public');
                $message->attachments()->create([
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        // Update last message timestamp
        $chat->update(['last_message_at' => now()]);

        // Publish ke Redis untuk real-time update
        $this->publishChatEvent('chat.message', [
            'chat_id' => $chat->id,
            'message' => new MessageResource($message->load('attachments')),
        ]);

        // Trigger kirim ke WhatsApp via bot service
        $this->dispatchToWhatsApp($chat, $message);

        return response()->json([
            'message' => 'Pesan berhasil dikirim.',
            'data' => new MessageResource($message->load('attachments')),
        ], 201);
    }

    /**
     * Mark chat as resolved
     */
    public function resolve(int $id, Request $request): JsonResponse
    {
        $chat = Chat::findOrFail($id);

        if ($chat->status === 'resolved') {
            return response()->json([
                'message' => 'Chat sudah resolved sebelumnya.',
            ], 422);
        }

        $chat->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $request->user()->id,
        ]);

        // Notify via Redis pub/sub
        $this->publishChatEvent('chat.resolved', [
            'chat_id' => $chat->id,
            'resolved_by' => $request->user()->name,
        ]);

        return response()->json([
            'message' => 'Chat berhasil ditandai sebagai resolved.',
            'chat' => new ChatResource($chat->fresh(['customer', 'assignedAdmin'])),
        ]);
    }

    /**
     * Publish event ke Redis untuk real-time updates
     */
    private function publishChatEvent(string $event, array $data): void
    {
        try {
            Redis::publish($event, json_encode([
                'event' => $event,
                'data' => $data,
                'timestamp' => now()->toISOString(),
            ]));
        } catch (\Exception $e) {
            // Log error tapi jangan gagalkan request
            logger()->error('Redis publish failed', [
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Dispatch message ke WhatsApp via bot service
     */
    private function dispatchToWhatsApp(Chat $chat, Message $message): void
    {
        try {
            Redis::publish('whatsapp.outgoing', json_encode([
                'chat_id' => $chat->id,
                'phone' => $chat->customer->phone,
                'message' => $message->content,
                'message_type' => $message->message_type,
                'attachments' => $message->attachments->map(fn($a) => [
                    'path' => $a->file_path,
                    'type' => $a->file_type,
                ])->toArray(),
            ]));
        } catch (\Exception $e) {
            logger()->error('WhatsApp dispatch failed', [
                'chat_id' => $chat->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
