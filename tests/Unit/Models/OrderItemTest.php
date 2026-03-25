<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;

describe('OrderItem Model', function () {

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $item = new OrderItem();
            $fillable = $item->getFillable();

            expect($fillable)->toContain('order_id')
                ->toContain('product_id')
                ->toContain('qty')
                ->toContain('price')
                ->toContain('subtotal');
        });
    });

    describe('casts', function () {
        it('casts qty to integer', function () {
            $order = Order::factory()->create();
            $product = Product::factory()->create();
            $item = OrderItem::factory()->make([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'qty' => '5',
            ]);

            expect($item->qty)->toBeInt();
        });

        it('casts price to decimal', function () {
            $item = new OrderItem();
            $casts = $item->getCasts();
            expect($casts['price'])->toBe('decimal:2');
        });

        it('casts subtotal to decimal', function () {
            $item = new OrderItem();
            $casts = $item->getCasts();
            expect($casts['subtotal'])->toBe('decimal:2');
        });
    });

    describe('relationships', function () {
        it('belongs to order', function () {
            $order = Order::factory()->create();
            $product = Product::factory()->create();
            $item = OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
            ]);

            expect($item->order)->toBeInstanceOf(Order::class);
            expect($item->order->id)->toBe($order->id);
        });

        it('belongs to product', function () {
            $order = Order::factory()->create();
            $product = Product::factory()->create();
            $item = OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
            ]);

            expect($item->product)->toBeInstanceOf(Product::class);
            expect($item->product->id)->toBe($product->id);
        });
    });

    describe('auto subtotal calculation', function () {
        it('calculates subtotal on creating', function () {
            $order = Order::factory()->create();
            $product = Product::factory()->create();

            $item = OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'qty' => 5,
                'price' => 10000,
            ]);

            expect((float) $item->subtotal)->toBe(50000.00);
        });

        it('recalculates subtotal on updating', function () {
            $order = Order::factory()->create();
            $product = Product::factory()->create();

            $item = OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'qty' => 5,
                'price' => 10000,
            ]);

            $item->update(['qty' => 10]);

            expect((float) $item->fresh()->subtotal)->toBe(100000.00);
        });

        it('recalculates when price changes', function () {
            $order = Order::factory()->create();
            $product = Product::factory()->create();

            $item = OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'qty' => 5,
                'price' => 10000,
            ]);

            $item->update(['price' => 15000]);

            expect((float) $item->fresh()->subtotal)->toBe(75000.00);
        });
    });

    describe('factory', function () {
        it('creates a valid order item', function () {
            $order = Order::factory()->create();
            $product = Product::factory()->create();

            $item = OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
            ]);

            expect($item->id)->not->toBeNull();
            expect($item->qty)->toBeGreaterThan(0);
            expect((float) $item->price)->toBeGreaterThan(0);
        });
    });
});
