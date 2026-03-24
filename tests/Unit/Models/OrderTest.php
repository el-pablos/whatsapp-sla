<?php

use App\Models\Order;

describe('Order Model', function () {

    describe('constants', function () {
        it('has STATUS_PENDING constant', function () {
            expect(Order::STATUS_PENDING)->toBe('pending');
        });

        it('has STATUS_CONFIRMED constant', function () {
            expect(Order::STATUS_CONFIRMED)->toBe('confirmed');
        });

        it('has STATUS_PROCESSING constant', function () {
            expect(Order::STATUS_PROCESSING)->toBe('processing');
        });

        it('has STATUS_COMPLETED constant', function () {
            expect(Order::STATUS_COMPLETED)->toBe('completed');
        });

        it('has STATUS_CANCELLED constant', function () {
            expect(Order::STATUS_CANCELLED)->toBe('cancelled');
        });
    });

    describe('statuses method', function () {
        it('returns all valid statuses', function () {
            $statuses = Order::statuses();

            expect($statuses)->toBeArray()
                ->toHaveCount(5)
                ->toContain(Order::STATUS_PENDING)
                ->toContain(Order::STATUS_CONFIRMED)
                ->toContain(Order::STATUS_PROCESSING)
                ->toContain(Order::STATUS_COMPLETED)
                ->toContain(Order::STATUS_CANCELLED);
        });
    });

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $order = new Order();
            $fillable = $order->getFillable();

            expect($fillable)->toContain('order_number')
                ->toContain('customer_phone')
                ->toContain('customer_name')
                ->toContain('items')
                ->toContain('subtotal')
                ->toContain('discount')
                ->toContain('total')
                ->toContain('status')
                ->toContain('notes')
                ->toContain('source')
                ->toContain('metadata');
        });
    });

    describe('casts', function () {
        it('casts items to array', function () {
            $order = new Order();
            $casts = $order->getCasts();
            expect($casts['items'])->toBe('array');
        });

        it('casts metadata to array', function () {
            $order = new Order();
            $casts = $order->getCasts();
            expect($casts['metadata'])->toBe('array');
        });

        it('casts subtotal to decimal', function () {
            $order = new Order();
            $casts = $order->getCasts();
            expect($casts['subtotal'])->toBe('decimal:2');
        });

        it('casts total to decimal', function () {
            $order = new Order();
            $casts = $order->getCasts();
            expect($casts['total'])->toBe('decimal:2');
        });

        it('casts discount to decimal', function () {
            $order = new Order();
            $casts = $order->getCasts();
            expect($casts['discount'])->toBe('decimal:2');
        });
    });

    describe('generateOrderNumber', function () {
        it('generates order number with correct prefix', function () {
            $orderNumber = Order::generateOrderNumber();
            expect($orderNumber)->toStartWith('ORD-');
        });

        it('generates order number with date format', function () {
            $orderNumber = Order::generateOrderNumber();
            $datePattern = now()->format('Ymd');
            expect($orderNumber)->toContain($datePattern);
        });

        it('generates unique order numbers', function () {
            $orderNumber1 = Order::generateOrderNumber();
            $orderNumber2 = Order::generateOrderNumber();
            expect($orderNumber1)->not->toBe($orderNumber2);
        });

        it('generates order number with correct format', function () {
            $orderNumber = Order::generateOrderNumber();
            // Format: ORD-YYYYMMDD-XXXX
            expect($orderNumber)->toMatch('/^ORD-\d{8}-[A-Z0-9]{4}$/');
        });
    });

    describe('scopes', function () {
        it('scopeByStatus filters by specific status', function () {
            Order::factory()->create(['status' => Order::STATUS_PENDING]);
            Order::factory()->create(['status' => Order::STATUS_CONFIRMED]);

            $pendingOrders = Order::byStatus(Order::STATUS_PENDING)->get();
            expect($pendingOrders)->toHaveCount(1);
            expect($pendingOrders->first()->status)->toBe(Order::STATUS_PENDING);
        });

        it('scopePending filters pending orders', function () {
            Order::factory()->create(['status' => Order::STATUS_PENDING]);
            Order::factory()->create(['status' => Order::STATUS_CONFIRMED]);
            Order::factory()->create(['status' => Order::STATUS_COMPLETED]);

            $pendingOrders = Order::pending()->get();
            expect($pendingOrders)->toHaveCount(1);
            expect($pendingOrders->first()->status)->toBe(Order::STATUS_PENDING);
        });

        it('scopeActive excludes cancelled and completed orders', function () {
            Order::factory()->create(['status' => Order::STATUS_PENDING]);
            Order::factory()->create(['status' => Order::STATUS_CONFIRMED]);
            Order::factory()->create(['status' => Order::STATUS_CANCELLED]);
            Order::factory()->create(['status' => Order::STATUS_COMPLETED]);

            $activeOrders = Order::active()->get();
            expect($activeOrders)->toHaveCount(2);

            $statuses = $activeOrders->pluck('status')->toArray();
            expect($statuses)->not->toContain(Order::STATUS_CANCELLED);
            expect($statuses)->not->toContain(Order::STATUS_COMPLETED);
        });
    });

    describe('soft deletes', function () {
        it('supports soft deletes', function () {
            $order = Order::factory()->create();
            $orderId = $order->id;

            $order->delete();

            expect(Order::find($orderId))->toBeNull();
            expect(Order::withTrashed()->find($orderId))->not->toBeNull();
        });

        it('can restore soft deleted order', function () {
            $order = Order::factory()->create();
            $orderId = $order->id;

            $order->delete();
            Order::withTrashed()->find($orderId)->restore();

            expect(Order::find($orderId))->not->toBeNull();
        });
    });

    describe('factory', function () {
        it('creates a valid order', function () {
            $order = Order::factory()->create();

            expect($order->id)->not->toBeNull();
            expect($order->customer_phone)->not->toBeEmpty();
            expect($order->status)->toBeIn(Order::statuses());
        });

        it('creates order with items as array', function () {
            $order = Order::factory()->create([
                'items' => [
                    ['product_id' => 1, 'qty' => 2, 'price' => 25000]
                ]
            ]);

            expect($order->items)->toBeArray()
                ->toHaveCount(1);
        });

        it('creates order with metadata as array', function () {
            $order = Order::factory()->create([
                'metadata' => ['source' => 'whatsapp', 'chat_id' => '123']
            ]);

            expect($order->metadata)->toBeArray()
                ->toHaveKey('source');
        });
    });
});
