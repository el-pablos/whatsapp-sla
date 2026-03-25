<?php

use App\Models\PriceHistory;
use App\Models\Product;
use App\Models\User;

describe('PriceHistory Model', function () {

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $history = new PriceHistory();
            $fillable = $history->getFillable();

            expect($fillable)->toContain('product_id')
                ->toContain('old_price')
                ->toContain('new_price')
                ->toContain('changed_by');
        });
    });

    describe('casts', function () {
        it('casts old_price to decimal', function () {
            $history = new PriceHistory();
            $casts = $history->getCasts();
            expect($casts['old_price'])->toBe('decimal:2');
        });

        it('casts new_price to decimal', function () {
            $history = new PriceHistory();
            $casts = $history->getCasts();
            expect($casts['new_price'])->toBe('decimal:2');
        });
    });

    describe('relationships', function () {
        it('belongs to product', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->create([
                'product_id' => $product->id,
                'changed_by' => $user->id,
            ]);

            expect($history->product)->toBeInstanceOf(Product::class);
            expect($history->product->id)->toBe($product->id);
        });

        it('belongs to user via user()', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->create([
                'product_id' => $product->id,
                'changed_by' => $user->id,
            ]);

            expect($history->user)->toBeInstanceOf(User::class);
            expect($history->user->id)->toBe($user->id);
        });

        it('has changedBy alias for user', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->create([
                'product_id' => $product->id,
                'changed_by' => $user->id,
            ]);

            expect($history->changedBy)->toBeInstanceOf(User::class);
            expect($history->changedBy->id)->toBe($user->id);
        });
    });

    describe('computed attributes', function () {
        it('calculates price_change_percentage for increase', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->make([
                'product_id' => $product->id,
                'changed_by' => $user->id,
                'old_price' => 10000,
                'new_price' => 12000,
            ]);

            expect($history->price_change_percentage)->toBe(20.0);
        });

        it('calculates price_change_percentage for decrease', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->make([
                'product_id' => $product->id,
                'changed_by' => $user->id,
                'old_price' => 10000,
                'new_price' => 8000,
            ]);

            expect($history->price_change_percentage)->toBe(-20.0);
        });

        it('handles zero old_price', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->make([
                'product_id' => $product->id,
                'changed_by' => $user->id,
                'old_price' => 0,
                'new_price' => 10000,
            ]);

            expect($history->price_change_percentage)->toBe(100.0);
        });

        it('calculates price_difference', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->make([
                'product_id' => $product->id,
                'changed_by' => $user->id,
                'old_price' => 10000,
                'new_price' => 15000,
            ]);

            expect($history->price_difference)->toBe(5000.0);
        });

        it('calculates negative price_difference', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();
            $history = PriceHistory::factory()->make([
                'product_id' => $product->id,
                'changed_by' => $user->id,
                'old_price' => 15000,
                'new_price' => 10000,
            ]);

            expect($history->price_difference)->toBe(-5000.0);
        });
    });

    describe('price direction methods', function () {
        it('isPriceIncrease returns true when price increased', function () {
            $history = PriceHistory::factory()->make([
                'old_price' => 10000,
                'new_price' => 15000,
            ]);

            expect($history->isPriceIncrease())->toBeTrue();
            expect($history->isPriceDecrease())->toBeFalse();
        });

        it('isPriceDecrease returns true when price decreased', function () {
            $history = PriceHistory::factory()->make([
                'old_price' => 15000,
                'new_price' => 10000,
            ]);

            expect($history->isPriceDecrease())->toBeTrue();
            expect($history->isPriceIncrease())->toBeFalse();
        });

        it('both return false when price unchanged', function () {
            $history = PriceHistory::factory()->make([
                'old_price' => 10000,
                'new_price' => 10000,
            ]);

            expect($history->isPriceIncrease())->toBeFalse();
            expect($history->isPriceDecrease())->toBeFalse();
        });
    });

    describe('formatted_change attribute', function () {
        it('formats price increase correctly', function () {
            $history = PriceHistory::factory()->make([
                'old_price' => 10000,
                'new_price' => 12000,
            ]);

            $formatted = $history->formatted_change;

            expect($formatted)->toContain('10.000');
            expect($formatted)->toContain('12.000');
            expect($formatted)->toContain('+20');
        });

        it('formats price decrease correctly', function () {
            $history = PriceHistory::factory()->make([
                'old_price' => 10000,
                'new_price' => 8000,
            ]);

            $formatted = $history->formatted_change;

            expect($formatted)->toContain('-20');
        });
    });

    describe('scopes', function () {
        it('scopeForProduct filters by product', function () {
            $product1 = Product::factory()->create();
            $product2 = Product::factory()->create();
            $user = User::factory()->create();

            PriceHistory::factory()->create(['product_id' => $product1->id, 'changed_by' => $user->id]);
            PriceHistory::factory()->create(['product_id' => $product2->id, 'changed_by' => $user->id]);

            $histories = PriceHistory::forProduct($product1->id)->get();
            expect($histories)->toHaveCount(1);
            expect($histories->first()->product_id)->toBe($product1->id);
        });

        it('scopeInPeriod filters by date range', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();

            PriceHistory::factory()->create([
                'product_id' => $product->id,
                'changed_by' => $user->id,
                'created_at' => now()->subDays(5),
            ]);
            PriceHistory::factory()->create([
                'product_id' => $product->id,
                'changed_by' => $user->id,
                'created_at' => now()->subDays(15),
            ]);

            $histories = PriceHistory::inPeriod(now()->subDays(10), now())->get();
            expect($histories)->toHaveCount(1);
        });
    });

    describe('factory', function () {
        it('creates a valid price history', function () {
            $product = Product::factory()->create();
            $user = User::factory()->create();

            $history = PriceHistory::factory()->create([
                'product_id' => $product->id,
                'changed_by' => $user->id,
            ]);

            expect($history->id)->not->toBeNull();
            expect((float) $history->old_price)->toBeGreaterThanOrEqual(0);
            expect((float) $history->new_price)->toBeGreaterThanOrEqual(0);
        });
    });
});
