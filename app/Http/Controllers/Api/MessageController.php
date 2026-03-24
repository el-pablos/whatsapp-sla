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
            'chat_id'       => 'required|exists:chats,id',
            'wa_message_id' => 'required|string',
            'direction'     => 'required|in:in,out',
            'content'       => 'required|string',
            'type'          => 'nullable|in:text,image,button,list',
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
        $existing = Message::where('wa_message_id', $request->wa_message_id)->first();
        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'Message sudah ada',
                'data'    => $existing,
            ], 200);
        }

        $message = Message::create([
            'chat_id'       => $request->chat_id,
            'wa_message_id' => $request->wa_message_id,
            'direction'     => $request->direction,
            'content'       => $request->content,
            'type'          => $request->type ?? 'text',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message berhasil disimpan',
            'data'    => $message,
        ], 201);
    }
}
