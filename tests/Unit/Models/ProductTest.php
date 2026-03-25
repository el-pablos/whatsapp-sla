<?php

use App\Models\Product;

describe('Product Model', function () {

    describe('constants', function () {
        it('has TYPE_TELUR constant', function () {
            expect(Product::TYPE_TELUR)->toBe('telur');
        });

        it('has TYPE_AYAM constant', function () {
            expect(Product::TYPE_AYAM)->toBe('ayam');
        });

        it('has size constants', function () {
            expect(Product::SIZE_S)->toBe('S');
            expect(Product::SIZE_M)->toBe('M');
            expect(Product::SIZE_L)->toBe('L');
            expect(Product::SIZE_XL)->toBe('XL');
        });

        it('has unit constants', function () {
            expect(Product::UNIT_KG)->toBe('kg');
            expect(Product::UNIT_PCS)->toBe('pcs');
            expect(Product::UNIT_PETI)->toBe('peti');
            expect(Product::UNIT_EKOR)->toBe('ekor');
        });

        it('has status constants', function () {
            expect(Product::STATUS_ACTIVE)->toBe('active');
            expect(Product::STATUS_INACTIVE)->toBe('inactive');
        });
    });

    describe('static methods', function () {
        it('getTypes returns array of types', function () {
            $types = Product::getTypes();
            expect($types)->toBeArray()
                ->toContain(Product::TYPE_TELUR)
                ->toContain(Product::TYPE_AYAM);
        });

        it('getSizes returns array of sizes', function () {
            $sizes = Product::getSizes();
            expect($sizes)->toBeArray()
                ->toHaveCount(4)
                ->toContain(Product::SIZE_S);
        });

        it('getUnits returns array of units', function () {
            $units = Product::getUnits();
            expect($units)->toBeArray()
                ->toHaveCount(4)
                ->toContain(Product::UNIT_KG);
        });

        it('getStatuses returns array of statuses', function () {
            $statuses = Product::getStatuses();
            expect($statuses)->toBeArray()
                ->toContain(Product::STATUS_ACTIVE)
                ->toContain(Product::STATUS_INACTIVE);
        });
    });

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $product = new Product();
            $fillable = $product->getFillable();

            expect($fillable)->toContain('name')
                ->toContain('type')
                ->toContain('size')
                ->toContain('unit')
                ->toContain('price')
                ->toContain('stock')
                ->toContain('status');
        });
    });

    describe('default attributes', function () {
        it('has default status as active', function () {
            $product = new Product();
            expect($product->status)->toBe(Product::STATUS_ACTIVE);
        });

        it('has default unit as kg', function () {
            $product = new Product();
            expect($product->unit)->toBe(Product::UNIT_KG);
        });

        it('has default stock as 0', function () {
            $product = new Product();
            expect($product->stock)->toBe(0);
        });
    });

    describe('casts', function () {
        it('casts price to decimal', function () {
            $product = Product::factory()->make(['price' => 25000]);
            $casts = $product->getCasts();
            expect($casts['price'])->toBe('decimal:2');
        });

        it('casts stock to integer', function () {
            $product = Product::factory()->make(['stock' => '100']);
            $casts = $product->getCasts();
            expect($casts['stock'])->toBe('integer');
        });
    });

    describe('type methods', function () {
        it('correctly identifies telur product', function () {
            $product = Product::factory()->telur()->make();
            expect($product->isTelur())->toBeTrue();
            expect($product->isAyam())->toBeFalse();
        });

        it('correctly identifies ayam product', function () {
            $product = Product::factory()->ayam()->make();
            expect($product->isAyam())->toBeTrue();
            expect($product->isTelur())->toBeFalse();
        });
    });

    describe('status methods', function () {
        it('correctly identifies active product', function () {
            $product = Product::factory()->active()->make();
            expect($product->isActive())->toBeTrue();
        });

        it('correctly identifies inactive product', function () {
            $product = Product::factory()->inactive()->make();
            expect($product->isActive())->toBeFalse();
        });
    });

    describe('stock methods', function () {
        it('hasStock returns true when stock > 0', function () {
            $product = Product::factory()->withStock(10)->make();
            expect($product->hasStock())->toBeTrue();
        });

        it('hasStock returns false when stock is 0', function () {
            $product = Product::factory()->outOfStock()->make();
            expect($product->hasStock())->toBeFalse();
        });
    });

    describe('scopes', function () {
        it('scopeActive filters active products', function () {
            Product::factory()->active()->create();
            Product::factory()->inactive()->create();

            $activeProducts = Product::active()->get();
            expect($activeProducts)->toHaveCount(1);
            expect($activeProducts->first()->status)->toBe(Product::STATUS_ACTIVE);
        });

        it('scopeByType filters by type', function () {
            Product::factory()->telur()->create();
            Product::factory()->ayam()->create();

            $telurProducts = Product::byType(Product::TYPE_TELUR)->get();
            expect($telurProducts)->toHaveCount(1);
            expect($telurProducts->first()->type)->toBe(Product::TYPE_TELUR);
        });

        it('scopeTelur filters telur products', function () {
            Product::factory()->telur()->create();
            Product::factory()->ayam()->create();

            $telurProducts = Product::telur()->get();
            expect($telurProducts)->toHaveCount(1);
            expect($telurProducts->first()->type)->toBe(Product::TYPE_TELUR);
        });

        it('scopeAyam filters ayam products', function () {
            Product::factory()->telur()->create();
            Product::factory()->ayam()->create();

            $ayamProducts = Product::ayam()->get();
            expect($ayamProducts)->toHaveCount(1);
            expect($ayamProducts->first()->type)->toBe(Product::TYPE_AYAM);
        });
    });

    describe('factory', function () {
        it('creates a valid product', function () {
            $product = Product::factory()->create();

            expect($product->id)->not->toBeNull();
            expect($product->name)->not->toBeEmpty();
            expect($product->type)->toBeIn(Product::getTypes());
        });

        it('creates telur with telur state', function () {
            $product = Product::factory()->telur()->create();
            expect($product->type)->toBe(Product::TYPE_TELUR);
        });

        it('creates ayam with ayam state', function () {
            $product = Product::factory()->ayam()->create();
            expect($product->type)->toBe(Product::TYPE_AYAM);
        });

        it('creates product with specific stock', function () {
            $product = Product::factory()->withStock(50)->create();
            expect($product->stock)->toBe(50);
        });
    });
});
