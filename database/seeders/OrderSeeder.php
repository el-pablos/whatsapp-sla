<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::all();

        if ($products->isEmpty()) {
            $this->command->warn('No products found. Please run ProductSeeder first.');
            return;
        }

        // Buat 20 order dengan status berbeda-beda
        Order::factory()
            ->count(5)
            ->pending()
            ->create()
            ->each(function ($order) use ($products) {
                $this->createItems($order, $products);
            });

        Order::factory()
            ->count(5)
            ->confirmed()
            ->create()
            ->each(function ($order) use ($products) {
                $this->createItems($order, $products);
            });

        Order::factory()
            ->count(5)
            ->processing()
            ->create()
            ->each(function ($order) use ($products) {
                $this->createItems($order, $products);
            });

        Order::factory()
            ->count(5)
            ->completed()
            ->create()
            ->each(function ($order) use ($products) {
                $this->createItems($order, $products);
            });
    }

    private function createItems(Order $order, $products): void
    {
        $itemCount = rand(1, 4);
        $selectedProducts = $products->random($itemCount);

        foreach ($selectedProducts as $product) {
            OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'price' => $product->price,
            ]);
        }

        $order->calculateTotal();
    }
}
