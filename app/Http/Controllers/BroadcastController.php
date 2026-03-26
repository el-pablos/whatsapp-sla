<?php

namespace App\Http\Controllers;

use App\Jobs\SendBroadcastMessage;
use App\Models\BroadcastLog;
use App\Models\Chat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class BroadcastController extends Controller
{
    /**
     * Get list of customers for broadcast
     */
    public function customers(Request $request): JsonResponse
    {
        $query = Chat::query()
            ->select('id', 'customer_phone', 'customer_name', 'status', 'last_message_at')
            ->whereNotNull('customer_phone')
            ->where('customer_phone', '!=', '');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by name or phone
        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'LIKE', "%{$search}%")
                    ->orWhere('customer_phone', 'LIKE', "%{$search}%");
            });
        }

        // Get unique customers by phone
        $customers = $query->orderBy('last_message_at', 'desc')
            ->get()
            ->unique('customer_phone')
            ->values()
            ->map(function ($chat) {
                return [
                    'id' => $chat->id,
                    'phone' => $chat->customer_phone,
                    'name' => $chat->customer_name ?? 'Unknown',
                    'status' => $chat->status,
                    'last_active' => $chat->last_message_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $customers,
            'meta' => [
                'total' => $customers->count(),
            ],
        ]);
    }

    /**
     * Send broadcast message
     */
    public function send(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:1|max:4096',
            'recipients' => 'required|array|min:1|max:500',
            'recipients.*' => 'required|string',
            'type' => 'sometimes|in:manual,catalog',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $recipients = collect($request->recipients)->unique()->values()->toArray();

        try {
            // Create broadcast log
            $broadcast = BroadcastLog::create([
                'user_id' => $request->user()?->id,
                'type' => $request->input('type', 'manual'),
                'message' => $request->message,
                'recipients' => $recipients,
                'total_recipients' => count($recipients),
                'status' => 'pending',
            ]);

            // Dispatch job to process broadcast
            SendBroadcastMessage::dispatch($broadcast->id);

            Log::info('Broadcast created and queued', [
                'broadcast_id' => $broadcast->id,
                'total_recipients' => count($recipients),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Broadcast berhasil dijadwalkan',
                'data' => [
                    'broadcast_id' => $broadcast->id,
                    'total_recipients' => count($recipients),
                    'status' => 'pending',
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create broadcast', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat broadcast: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get broadcast status/progress
     */
    public function status(int $id): JsonResponse
    {
        $broadcast = BroadcastLog::find($id);

        if (! $broadcast) {
            return response()->json([
                'success' => false,
                'message' => 'Broadcast tidak ditemukan',
            ], 404);
        }

        $progress = $broadcast->total_recipients > 0
            ? round(($broadcast->sent_count + $broadcast->failed_count) / $broadcast->total_recipients * 100)
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $broadcast->id,
                'status' => $broadcast->status,
                'total_recipients' => $broadcast->total_recipients,
                'sent_count' => $broadcast->sent_count,
                'failed_count' => $broadcast->failed_count,
                'progress' => $progress,
                'started_at' => $broadcast->started_at?->toIso8601String(),
                'completed_at' => $broadcast->completed_at?->toIso8601String(),
                'error_message' => $broadcast->error_message,
            ],
        ]);
    }

    /**
     * Get broadcast history
     */
    public function history(Request $request): JsonResponse
    {
        $broadcasts = BroadcastLog::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $broadcasts->items(),
            'meta' => [
                'current_page' => $broadcasts->currentPage(),
                'last_page' => $broadcasts->lastPage(),
                'per_page' => $broadcasts->perPage(),
                'total' => $broadcasts->total(),
            ],
        ]);
    }
}
