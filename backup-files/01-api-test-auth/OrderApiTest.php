<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Redis;

beforeEach(function () {
    config(['services.bot.api_token' => 'test-api-token']);
});

describe('Order API', function () {

    describe('GET /api/orders', function () {
        it('returns paginated orders', function () {
            Order::factory()->count(20)->create();

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson('/api/orders');

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonStructure([
                    'success',
                    'data',
                    'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                ]);
        });

        it('filters orders by status', function () {
            Order::factory()->count(3)->create(['status' => Order::STATUS_PENDING]);
            Order::factory()->count(2)->create(['status' => Order::STATUS_COMPLETED]);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson('/api/orders?status=pending');

            $response->assertStatus(200);
            expect($response->json('meta.total'))->toBe(3);
        });

        it('searches orders by customer name', function () {
            Order::factory()->create(['customer_name' => 'John Doe']);
            Order::factory()->create(['customer_name' => 'Jane Smith']);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson('/api/orders?search=John');

            $response->assertStatus(200);
            expect($response->json('meta.total'))->toBe(1);
        });

        it('searches orders by customer phone', function () {
            Order::factory()->create(['customer_phone' => '081234567890']);
            Order::factory()->create(['customer_phone' => '089876543210']);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson('/api/orders?search=1234');

            $response->assertStatus(200);
            expect($response->json('meta.total'))->toBe(1);
        });

        it('filters by date range', function () {
            Order::factory()->create(['created_at' => now()->subDays(5)]);
            Order::factory()->create(['created_at' => now()->subDays(15)]);

            $dateFrom = now()->subDays(10)->format('Y-m-d');
            $dateTo = now()->format('Y-m-d');

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson("/api/orders?date_from={$dateFrom}&date_to={$dateTo}");

            $response->assertStatus(200);
            expect($response->json('meta.total'))->toBe(1);
        });

        it('respects per_page parameter', function () {
            Order::factory()->count(20)->create();

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson('/api/orders?per_page=5');

            $response->assertStatus(200);
            expect($response->json('meta.per_page'))->toBe(5);
            expect(count($response->json('data')))->toBe(5);
        });
    });

    describe('GET /api/orders/{id}', function () {
        it('returns order detail with items', function () {
            $order = Order::factory()->create();

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson("/api/orders/{$order->id}");

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonStructure(['success', 'data']);
        });

        it('returns 404 for non-existent order', function () {
            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->getJson('/api/orders/999');

            $response->assertStatus(404);
        });
    });

    describe('POST /api/orders', function () {
        beforeEach(function () {
            Redis::shouldReceive('publish')->andReturn(1);
        });

        it('creates new order', function () {
            $chat = Chat::factory()->create();
            $product = Product::factory()->create();

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'customer_name' => 'John Doe',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'name' => $product->name,
                        'quantity' => 2,
                        'price' => 25000,
                    ],
                ],
                'total_amount' => 50000,
            ]);

            $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Order berhasil dibuat',
                ]);

            $this->assertDatabaseHas('orders', [
                'customer_phone' => '081234567890',
                'customer_name' => 'John Doe',
                'status' => Order::STATUS_PENDING,
            ]);
        });

        it('calculates total from items', function () {
            $chat = Chat::factory()->create();
            $product = Product::factory()->create();

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'customer_name' => 'John Doe',
                'items' => [
                    ['product_id' => $product->id, 'name' => 'Item 1', 'quantity' => 2, 'price' => 10000],
                    ['product_id' => $product->id, 'name' => 'Item 2', 'quantity' => 3, 'price' => 5000],
                ],
                'total_amount' => 35000,
            ]);

            $response->assertStatus(201);
            // Total: (2 * 10000) + (3 * 5000) = 35000
            expect((float) Order::latest()->first()->total)->toBe(35000.0);
        });

        it('applies discount', function () {
            $chat = Chat::factory()->create();
            $product = Product::factory()->create();

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'customer_name' => 'John Doe',
                'discount' => 5000,
                'items' => [
                    ['product_id' => $product->id, 'name' => 'Item 1', 'quantity' => 2, 'price' => 10000],
                ],
                'total_amount' => 15000,
            ]);

            $response->assertStatus(201);
            // Total: (2 * 10000) - 5000 = 15000
            expect((float) Order::latest()->first()->total)->toBe(15000.0);
        });

        it('validates required fields', function () {
            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->postJson('/api/orders', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['customer_phone', 'customer_name', 'items']);
        });

        it('validates items array is not empty', function () {
            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->postJson('/api/orders', [
                'customer_phone' => '081234567890',
                'customer_name' => 'John Doe',
                'items' => [],
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['items']);
        });
    });

    describe('PATCH /api/orders/{id}/status', function () {
        beforeEach(function () {
            Redis::shouldReceive('publish')->andReturn(1);
        });

        it('updates order status', function () {
            $order = Order::factory()->create(['status' => Order::STATUS_PENDING]);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->patchJson("/api/orders/{$order->id}/status", [
                'status' => Order::STATUS_CONFIRMED,
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Status order berhasil diupdate',
                ]);

            expect($order->fresh()->status)->toBe(Order::STATUS_CONFIRMED);
        });

        it('updates notes along with status', function () {
            $order = Order::factory()->create(['status' => Order::STATUS_PENDING, 'notes' => null]);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->patchJson("/api/orders/{$order->id}/status", [
                'status' => Order::STATUS_PROCESSING,
                'notes' => 'Sedang diproses',
            ]);

            $response->assertStatus(200);
            expect($order->fresh()->notes)->toBe('Sedang diproses');
        });

        it('validates status value', function () {
            $order = Order::factory()->create();

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->patchJson("/api/orders/{$order->id}/status", [
                'status' => 'invalid_status',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['status']);
        });

        it('returns 404 for non-existent order', function () {
            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->patchJson('/api/orders/999/status', [
                'status' => Order::STATUS_CONFIRMED,
            ]);

            $response->assertStatus(404);
        });
    });

    describe('DELETE /api/orders/{id}', function () {
        beforeEach(function () {
            Redis::shouldReceive('publish')->andReturn(1);
        });

        it('cancels pending order', function () {
            $order = Order::factory()->create(['status' => Order::STATUS_PENDING]);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->deleteJson("/api/orders/{$order->id}");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Order berhasil dibatalkan',
                ]);

            expect($order->fresh()->status)->toBe(Order::STATUS_CANCELLED);
        });

        it('cannot cancel non-pending order', function () {
            $order = Order::factory()->create(['status' => Order::STATUS_PROCESSING]);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->deleteJson("/api/orders/{$order->id}");

            $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'code' => 'ORDER_CANNOT_BE_CANCELLED',
                ]);

            expect($order->fresh()->status)->toBe(Order::STATUS_PROCESSING);
        });

        it('cannot cancel completed order', function () {
            $order = Order::factory()->create(['status' => Order::STATUS_COMPLETED]);

            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->deleteJson("/api/orders/{$order->id}");

            $response->assertStatus(422);
        });

        it('returns 404 for non-existent order', function () {
            $response = $this->withHeaders([
                'Authorization' => 'Bearer test-api-token',
                'Accept' => 'application/json',
            ])->deleteJson('/api/orders/999');

            $response->assertStatus(404);
        });
    });

    describe('Auth', function () {
        it('returns 401 without token', function () {
            $response = $this->getJson('/api/orders');

            $response->assertStatus(401)
                ->assertJson([
                    'success' => false,
                    'code' => 'MISSING_TOKEN',
                ]);
        });
    });
});
