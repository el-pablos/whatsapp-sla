<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\Chat;
use function Pest\Laravel\postJson;

describe('OrderController API', function () {

    describe('POST /api/orders', function () {
        it('creates order with valid data', function () {
            $chat = Chat::factory()->create();
            $product = Product::factory()->active()->withStock(100)->create(['price' => 25000]);

            $orderData = [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 5,
                        'price' => 25000,
                    ]
                ],
                'total_amount' => 125000,
                'notes' => 'Kirim siang ya',
            ];

            $response = postJson('/api/orders', $orderData);

            $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Order berhasil dibuat',
                ])
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => ['id', 'status', 'items']
                ]);
        });

        it('fails when chat_id is missing', function () {
            $product = Product::factory()->create();

            $response = postJson('/api/orders', [
                'customer_phone' => '081234567890',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1, 'price' => 25000]
                ],
                'total_amount' => 25000,
            ]);

            $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'code' => 'VALIDATION_ERROR',
                ])
                ->assertJsonValidationErrors(['chat_id']);
        });

        it('fails when items array is empty', function () {
            $chat = Chat::factory()->create();

            $response = postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'items' => [],
                'total_amount' => 0,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['items']);
        });

        it('fails when product_id does not exist', function () {
            $chat = Chat::factory()->create();

            $response = postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'items' => [
                    ['product_id' => 99999, 'quantity' => 1, 'price' => 25000]
                ],
                'total_amount' => 25000,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['items.0.product_id']);
        });

        it('fails when quantity is less than 1', function () {
            $chat = Chat::factory()->create();
            $product = Product::factory()->create();

            $response = postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 0, 'price' => 25000]
                ],
                'total_amount' => 0,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['items.0.quantity']);
        });

        it('fails when price is negative', function () {
            $chat = Chat::factory()->create();
            $product = Product::factory()->create();

            $response = postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1, 'price' => -1000]
                ],
                'total_amount' => 0,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['items.0.price']);
        });

        it('creates order with pending status', function () {
            $chat = Chat::factory()->create();
            $product = Product::factory()->create();

            $response = postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1, 'price' => 25000]
                ],
                'total_amount' => 25000,
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('data.status', Order::STATUS_PENDING);
        });

        it('creates order items correctly', function () {
            $chat = Chat::factory()->create();
            $product1 = Product::factory()->create(['price' => 20000]);
            $product2 = Product::factory()->create(['price' => 35000]);

            $response = postJson('/api/orders', [
                'chat_id' => $chat->id,
                'customer_phone' => '081234567890',
                'items' => [
                    ['product_id' => $product1->id, 'quantity' => 2, 'price' => 20000],
                    ['product_id' => $product2->id, 'quantity' => 3, 'price' => 35000],
                ],
                'total_amount' => 145000,
            ]);

            $response->assertStatus(201);
            $orderItems = $response->json('data.items');
            expect($orderItems)->toHaveCount(2);
        });
    });
});
