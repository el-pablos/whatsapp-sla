<?php

use App\Models\Product;
use function Pest\Laravel\getJson;

describe('ProductController API', function () {

    describe('GET /api/products', function () {
        it('returns all active products', function () {
            Product::factory()->active()->count(3)->create();
            Product::factory()->inactive()->create();

            $response = getJson('/api/products');

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [['id', 'name', 'type', 'price', 'stock', 'status']]
                ])
                ->assertJson(['success' => true])
                ->assertJsonCount(3, 'data');
        });

        it('returns empty array when no active products', function () {
            Product::factory()->inactive()->count(2)->create();

            $response = getJson('/api/products');

            $response->assertStatus(200)
                ->assertJson(['success' => true, 'data' => []]);
        });

        it('returns products ordered by name', function () {
            Product::factory()->active()->create(['name' => 'Telur B']);
            Product::factory()->active()->create(['name' => 'Ayam A']);
            Product::factory()->active()->create(['name' => 'Telur C']);

            $response = getJson('/api/products');

            $data = $response->json('data');
            expect($data[0]['name'])->toBe('Ayam A');
            expect($data[1]['name'])->toBe('Telur B');
            expect($data[2]['name'])->toBe('Telur C');
        });
    });

    describe('GET /api/products/{id}', function () {
        it('returns product detail for valid id', function () {
            $product = Product::factory()->create([
                'name' => 'Telur Ayam Premium',
                'price' => 25000,
            ]);

            $response = getJson("/api/products/{$product->id}");

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => ['id', 'name', 'type', 'price', 'stock', 'status']
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $product->id,
                        'name' => 'Telur Ayam Premium',
                    ]
                ]);
        });

        it('returns 404 for non-existent product', function () {
            $response = getJson('/api/products/99999');

            $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'code' => 'PRODUCT_NOT_FOUND',
                ]);
        });

        it('returns inactive product detail', function () {
            $product = Product::factory()->inactive()->create();

            $response = getJson("/api/products/{$product->id}");

            $response->assertStatus(200)
                ->assertJson(['success' => true]);
        });
    });

    describe('GET /api/products/type/{type}', function () {
        it('returns products filtered by type telur', function () {
            Product::factory()->telur()->active()->count(2)->create();
            Product::factory()->ayam()->active()->create();

            $response = getJson('/api/products/type/telur');

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonCount(2, 'data');

            foreach ($response->json('data') as $product) {
                expect($product['type'])->toBe(Product::TYPE_TELUR);
            }
        });

        it('returns products filtered by type ayam', function () {
            Product::factory()->telur()->active()->create();
            Product::factory()->ayam()->active()->count(3)->create();

            $response = getJson('/api/products/type/ayam');

            $response->assertStatus(200)
                ->assertJsonCount(3, 'data');

            foreach ($response->json('data') as $product) {
                expect($product['type'])->toBe(Product::TYPE_AYAM);
            }
        });

        it('returns empty when no products of type exist', function () {
            Product::factory()->telur()->active()->create();

            $response = getJson('/api/products/type/ayam');

            $response->assertStatus(200)
                ->assertJson(['success' => true, 'data' => []]);
        });

        it('excludes inactive products from type filter', function () {
            Product::factory()->telur()->active()->create();
            Product::factory()->telur()->inactive()->create();

            $response = getJson('/api/products/type/telur');

            $response->assertJsonCount(1, 'data');
        });
    });
});
