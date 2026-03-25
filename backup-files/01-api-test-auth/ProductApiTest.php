<?php

use App\Models\Product;
use App\Models\User;

describe('Product API', function () {

    describe('GET /api/products', function () {
        // fix: gunakan status field sesuai schema products - 2026-03-24
        it('returns active products', function () {
            Product::factory()->count(3)->create(['status' => Product::STATUS_ACTIVE]);
            Product::factory()->count(2)->create(['status' => Product::STATUS_INACTIVE]);

            $response = $this->getJson('/api/products');

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonCount(3, 'data');
        });

        it('returns products ordered by name', function () {
            Product::factory()->create(['name' => 'Zebra', 'status' => Product::STATUS_ACTIVE]);
            Product::factory()->create(['name' => 'Apple', 'status' => Product::STATUS_ACTIVE]);

            $response = $this->getJson('/api/products');

            $response->assertStatus(200);
            $data = $response->json('data');
            expect($data[0]['name'])->toBe('Apple');
            expect($data[1]['name'])->toBe('Zebra');
        });

        it('returns empty array when no active products', function () {
            Product::factory()->count(2)->create(['status' => Product::STATUS_INACTIVE]);

            $response = $this->getJson('/api/products');

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonCount(0, 'data');
        });
    });

    describe('GET /api/products/{id}', function () {
        it('returns product detail', function () {
            $product = Product::factory()->create(['name' => 'Telur Ayam']);

            $response = $this->getJson("/api/products/{$product->id}");

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => ['name' => 'Telur Ayam'],
                ]);
        });

        it('returns 404 for non-existent product', function () {
            $response = $this->getJson('/api/products/999');

            $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'code' => 'PRODUCT_NOT_FOUND',
                ]);
        });
    });

    describe('GET /api/products/type/{type}', function () {
        it('returns products filtered by type', function () {
            Product::factory()->create(['type' => 'telur', 'status' => Product::STATUS_ACTIVE]);
            Product::factory()->create(['type' => 'telur', 'status' => Product::STATUS_ACTIVE]);
            Product::factory()->create(['type' => 'ayam', 'status' => Product::STATUS_ACTIVE]);

            $response = $this->getJson('/api/products/type/telur');

            $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonCount(2, 'data');
        });

        it('returns empty array for non-existent type', function () {
            Product::factory()->create(['type' => 'telur', 'status' => Product::STATUS_ACTIVE]);

            $response = $this->getJson('/api/products/type/invalid');

            $response->assertStatus(200)
                ->assertJsonCount(0, 'data');
        });

        it('does not return inactive products', function () {
            Product::factory()->create(['type' => 'telur', 'status' => Product::STATUS_INACTIVE]);

            $response = $this->getJson('/api/products/type/telur');

            $response->assertStatus(200)
                ->assertJsonCount(0, 'data');
        });
    });
});
