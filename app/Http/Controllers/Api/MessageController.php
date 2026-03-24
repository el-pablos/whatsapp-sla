<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    /**
     * Store message dari bot
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chat_id'            => 'required|exists:chats,id',
            'whatsapp_message_id' => 'required|string',
            'direction'          => 'required|in:incoming,outgoing',
            'content'            => 'required|string',
            'message_type'       => 'nullable|in:text,image,document,audio,video',
            'metadata'           => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
                'code'    => 'VALIDATION_ERROR',
            ], 422);
        }

        // Check duplicate message
        $existing = Message::where('whatsapp_message_id', $request->whatsapp_message_id)->first();
        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'Message sudah ada',
                'data'    => $existing,
            ], 200);
        }

        $message = Message::create([
            'chat_id'             => $request->chat_id,
            'whatsapp_message_id' => $request->whatsapp_message_id,
            'direction'           => $request->direction,
            'content'             => $request->content,
            'message_type'        => $request->message_type ?? 'text',
            'metadata'            => $request->metadata,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message berhasil disimpan',
            'data'    => $message,
        ], 201);
    }
}
