<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    /**
     * List semua chats dengan pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = Chat::with(['handler', 'latestMessage']);

        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        if ($request->has('handled_by')) {
            $query->handledBy($request->handled_by);
        }

        $chats = $query->orderByDesc('last_message_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Daftar chat berhasil diambil',
            'data'    => $chats,
        ]);
    }

    /**
     * Tampilkan detail chat dengan messages
     */
    public function show(int $id): JsonResponse
    {
        $chat = Chat::with(['messages' => function ($query) {
            $query->orderBy('created_at', 'asc');
        }, 'handler'])->find($id);

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat tidak ditemukan',
                'code'    => 'CHAT_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail chat berhasil diambil',
            'data'    => $chat,
        ]);
    }

    /**
     * Update chat (takeover, resolve)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $chat = Chat::find($id);

        if (!$chat) {
            return response()->json([
                'success' => false,
                'message' => 'Chat tidak ditemukan',
                'code'    => 'CHAT_NOT_FOUND',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status'     => 'nullable|in:active,bot,admin,resolved',
            'handled_by' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
                'code'    => 'VALIDATION_ERROR',
            ], 422);
        }

        $data = [];

        if ($request->has('status')) {
            $data['status'] = $request->status;
        }

        if ($request->has('handled_by')) {
            $data['handled_by'] = $request->handled_by;
        }

        if (!empty($data)) {
            $chat->update($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Chat berhasil diupdate',
            'data'    => $chat->fresh(['handler']),
        ]);
    }

    /**
     * Create atau update chat
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'whatsapp_chat_id' => 'required|string',
            'customer_phone'   => 'required|string',
            'customer_name'    => 'nullable|string',
            'status'           => 'nullable|in:active,bot,admin,resolved',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
                'code'    => 'VALIDATION_ERROR',
            ], 422);
        }

        $chat = Chat::updateOrCreate(
            ['whatsapp_chat_id' => $request->whatsapp_chat_id],
            [
                'customer_phone' => $request->customer_phone,
                'customer_name'  => $request->customer_name ?? null,
                'status'         => $request->status ?? 'active',
                'last_message_at' => now(),
            ]
        );

        $wasCreated = $chat->wasRecentlyCreated;

        return response()->json([
            'success' => true,
            'message' => $wasCreated ? 'Chat berhasil dibuat' : 'Chat berhasil diupdate',
            'data'    => $chat,
        ], $wasCreated ? 201 : 200);
    }
}
