<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * Create order dari bot
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'chat_id'            => 'required|exists:chats,id',
            'customer_phone'     => 'required|string',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.price'      => 'required|numeric|min:0',
            'total_amount'       => 'required|numeric|min:0',
            'notes'              => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
                'code'    => 'VALIDATION_ERROR',
            ], 422);
        }

        try {
            $order = DB::transaction(function () use ($request) {
                $order = Order::create([
                    'chat_id'        => $request->chat_id,
                    'customer_phone' => $request->customer_phone,
                    'total_amount'   => $request->total_amount,
                    'status'         => 'pending',
                    'notes'          => $request->notes,
                ]);

                foreach ($request->items as $item) {
                    OrderItem::create([
                        'order_id'   => $order->id,
                        'product_id' => $item['product_id'],
                        'quantity'   => $item['quantity'],
                        'price'      => $item['price'],
                    ]);
                }

                return $order->load('items');
            });

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibuat',
                'data'    => $order,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat order',
                'code'    => 'ORDER_CREATION_FAILED',
            ], 500);
        }
    }
}
