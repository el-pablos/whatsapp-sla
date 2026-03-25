<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderCollection;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class OrderController extends Controller
{
    /**
     * List orders dengan pagination dan filter by status
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);

        $orders = Order::query()
            ->when($request->query('status'), fn ($q, $status) => $q->byStatus($status))
            ->when($request->query('search'), function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('customer_name', 'LIKE', "%{$search}%")
                          ->orWhere('customer_phone', 'LIKE', "%{$search}%");
                });
            })
            ->when($request->query('date_from'), fn ($q, $date) => $q->whereDate('created_at', '>=', $date))
            ->when($request->query('date_to'), fn ($q, $date) => $q->whereDate('created_at', '<=', $date))
            ->with('items')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Detail order dengan items
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with('items.product')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Create order dari bot
     */
    public function store(OrderRequest $request): JsonResponse
    {
        try {
            $order = DB::transaction(function () use ($request) {
                $validated = $request->validated();

                // Hitung total dari items
                $total = 0;
                $orderItems = [];

                foreach ($validated['items'] as $item) {
                    $subtotal = $item['quantity'] * $item['price'];
                    $total += $subtotal;

                    // fix: gunakan qty sesuai fillable di OrderItem model - 2026-03-24
                    $orderItems[] = [
                        'product_id' => $item['product_id'] ?? null,
                        'qty' => $item['quantity'],
                        'price' => $item['price'],
                        'subtotal' => $subtotal,
                    ];
                }

                // Apply discount jika ada
                $discount = $validated['discount'] ?? 0;
                $finalTotal = $total - $discount;

                $order = Order::create([
                    'customer_phone' => $validated['customer_phone'],
                    'customer_name' => $validated['customer_name'],
                    'total' => $finalTotal,
                    'status' => Order::STATUS_PENDING,
                    'notes' => $validated['notes'] ?? null,
                ]);

                // Create order items
                foreach ($orderItems as $item) {
                    $order->items()->create($item);
                }

                return $order->load('items');
            });

            // Trigger notifikasi via Redis saat order baru masuk
            $this->publishOrderNotification('order.created', $order);

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibuat',
                'data' => new OrderResource($order),
            ], 201);
        } catch (\Exception $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat order',
                'code' => 'ORDER_CREATION_FAILED',
            ], 500);
        }
    }

    /**
     * Update status order
     */
    public function updateStatus(int $id, UpdateOrderStatusRequest $request): JsonResponse
    {
        $order = Order::findOrFail($id);
        $previousStatus = $order->status;

        $order->update([
            'status' => $request->validated()['status'],
            'notes' => $request->validated()['notes'] ?? $order->notes,
        ]);

        // Trigger notifikasi via Redis untuk perubahan status
        $this->publishOrderNotification('order.status_changed', $order, [
            'previous_status' => $previousStatus,
            'new_status' => $order->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status order berhasil diupdate',
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Cancel/delete order
     */
    public function destroy(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        // Hanya bisa cancel jika status masih pending
        if ($order->status !== Order::STATUS_PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Order tidak bisa dibatalkan karena sudah diproses',
                'code' => 'ORDER_CANNOT_BE_CANCELLED',
            ], 422);
        }

        $order->update(['status' => Order::STATUS_CANCELLED]);

        // Trigger notifikasi via Redis
        $this->publishOrderNotification('order.cancelled', $order);

        return response()->json([
            'success' => true,
            'message' => 'Order berhasil dibatalkan',
        ]);
    }

    /**
     * Publish notifikasi ke Redis
     */
    private function publishOrderNotification(string $event, Order $order, array $extra = []): void
    {
        try {
            $payload = [
                'event' => $event,
                'order_id' => $order->id,
                'customer_phone' => $order->customer_phone,
                'customer_name' => $order->customer_name,
                'status' => $order->status,
                'total' => $order->total,
                'timestamp' => now()->toISOString(),
                ...$extra,
            ];

            Redis::publish('orders', json_encode($payload));
        } catch (\Exception $e) {
            // Log error tapi jangan gagalkan request
            report($e);
        }
    }
}
