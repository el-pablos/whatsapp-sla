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
     * Create atau update chat
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'whatsapp_chat_id' => 'required|string',
            'customer_phone'   => 'required|string',
            'customer_name'    => 'nullable|string',
            'status'           => 'nullable|in:active,resolved,pending',
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
