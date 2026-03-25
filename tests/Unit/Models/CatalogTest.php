<?php

use App\Models\Catalog;
use App\Models\Product;

describe('Catalog Model', function () {

    describe('constants', function () {
        it('has STATUS_ACTIVE constant', function () {
            expect(Catalog::STATUS_ACTIVE)->toBe('active');
        });

        it('has STATUS_INACTIVE constant', function () {
            expect(Catalog::STATUS_INACTIVE)->toBe('inactive');
        });
    });

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $catalog = new Catalog();
            $fillable = $catalog->getFillable();

            expect($fillable)->toContain('name')
                ->toContain('image')
                ->toContain('description')
                ->toContain('status');
        });
    });

    describe('casts', function () {
        it('casts status to string', function () {
            $catalog = Catalog::factory()->make();
            $casts = $catalog->getCasts();
            expect($casts['status'])->toBe('string');
        });
    });

    describe('relationships', function () {
        it('has many products through pivot', function () {
            $catalog = Catalog::factory()->create();
            $products = Product::factory()->count(3)->create();

            foreach ($products as $index => $product) {
                $catalog->products()->attach($product->id, ['sort_order' => $index]);
            }

            expect($catalog->products)->toHaveCount(3);
            expect($catalog->products->first())->toBeInstanceOf(Product::class);
        });

        it('orders products by sort_order', function () {
            $catalog = Catalog::factory()->create();
            $product1 = Product::factory()->create(['name' => 'Product A']);
            $product2 = Product::factory()->create(['name' => 'Product B']);
            $product3 = Product::factory()->create(['name' => 'Product C']);

            $catalog->products()->attach($product1->id, ['sort_order' => 3]);
            $catalog->products()->attach($product2->id, ['sort_order' => 1]);
            $catalog->products()->attach($product3->id, ['sort_order' => 2]);

            $orderedProducts = $catalog->products;
            expect($orderedProducts[0]->id)->toBe($product2->id);
            expect($orderedProducts[1]->id)->toBe($product3->id);
            expect($orderedProducts[2]->id)->toBe($product1->id);
        });
    });

    describe('scopes', function () {
        it('scopeActive filters active catalogs', function () {
            Catalog::factory()->active()->create();
            Catalog::factory()->inactive()->create();

            $activeCatalogs = Catalog::active()->get();
            expect($activeCatalogs)->toHaveCount(1);
            expect($activeCatalogs->first()->status)->toBe(Catalog::STATUS_ACTIVE);
        });

        it('scopeInactive filters inactive catalogs', function () {
            Catalog::factory()->active()->create();
            Catalog::factory()->inactive()->create();

            $inactiveCatalogs = Catalog::inactive()->get();
            expect($inactiveCatalogs)->toHaveCount(1);
            expect($inactiveCatalogs->first()->status)->toBe(Catalog::STATUS_INACTIVE);
        });
    });

    describe('isActive method', function () {
        it('returns true for active catalog', function () {
            $catalog = Catalog::factory()->active()->make();
            expect($catalog->isActive())->toBeTrue();
        });

        it('returns false for inactive catalog', function () {
            $catalog = Catalog::factory()->inactive()->make();
            expect($catalog->isActive())->toBeFalse();
        });
    });

    describe('generateWhatsAppFormat', function () {
        it('generates format with catalog name', function () {
            $catalog = Catalog::factory()->create(['name' => 'Test Catalog', 'description' => 'Test Description']);
            $format = $catalog->generateWhatsAppFormat();

            expect($format)->toContain('*Test Catalog*');
            expect($format)->toContain('_Test Description_');
        });

        it('generates format with products', function () {
            $catalog = Catalog::factory()->create(['name' => 'Catalog']);
            $product = Product::factory()->create([
                'name' => 'Telur Ayam',
                'price' => 25000,
                'stock' => 100,
                'unit' => 'kg',
                'status' => Product::STATUS_ACTIVE,
            ]);
            $catalog->products()->attach($product->id, ['sort_order' => 1]);

            $format = $catalog->generateWhatsAppFormat();

            expect($format)->toContain('*Telur Ayam*');
            expect($format)->toContain('25.000');
            expect($format)->toContain('Stok: 100 kg');
        });

        it('shows out of stock message', function () {
            $catalog = Catalog::factory()->create(['name' => 'Catalog']);
            $product = Product::factory()->create([
                'name' => 'Product',
                'price' => 10000,
                'stock' => 0,
                'status' => Product::STATUS_ACTIVE,
            ]);
            $catalog->products()->attach($product->id, ['sort_order' => 1]);

            $format = $catalog->generateWhatsAppFormat();

            expect($format)->toContain('_Stok habis_');
        });

        it('shows no products message when empty', function () {
            $catalog = Catalog::factory()->create(['name' => 'Empty Catalog']);

            $format = $catalog->generateWhatsAppFormat();

            expect($format)->toContain('Belum ada produk tersedia');
        });

        it('only shows active products', function () {
            $catalog = Catalog::factory()->create(['name' => 'Catalog']);
            $activeProduct = Product::factory()->create(['name' => 'Active', 'status' => Product::STATUS_ACTIVE]);
            $inactiveProduct = Product::factory()->create(['name' => 'Inactive', 'status' => Product::STATUS_INACTIVE]);

            $catalog->products()->attach($activeProduct->id, ['sort_order' => 1]);
            $catalog->products()->attach($inactiveProduct->id, ['sort_order' => 2]);

            $format = $catalog->generateWhatsAppFormat();

            expect($format)->toContain('*Active*');
            expect($format)->not->toContain('*Inactive*');
        });
    });

    describe('factory', function () {
        it('creates a valid catalog', function () {
            $catalog = Catalog::factory()->create();

            expect($catalog->id)->not->toBeNull();
            expect($catalog->name)->not->toBeEmpty();
        });

        it('creates active catalog with active state', function () {
            $catalog = Catalog::factory()->active()->create();
            expect($catalog->status)->toBe(Catalog::STATUS_ACTIVE);
        });

        it('creates inactive catalog with inactive state', function () {
            $catalog = Catalog::factory()->inactive()->create();
            expect($catalog->status)->toBe(Catalog::STATUS_INACTIVE);
        });
    });
});
