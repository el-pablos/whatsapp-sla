<?php

namespace Database\Seeders;

use App\Models\PriceHistory;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PriceHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = Product::all();
        $admin = User::where('role', 'admin')->first();

        if ($products->isEmpty()) {
            $this->command->info('No products found. Skipping price history seeder.');
            return;
        }

        foreach ($products as $product) {
            // Buat 3-5 history perubahan harga untuk setiap produk
            $historyCount = rand(3, 5);
            $currentPrice = $product->price;

            for ($i = 0; $i < $historyCount; $i++) {
                // Generate harga sebelumnya (simulasi mundur)
                $priceChange = rand(-15, 20) / 100; // -15% sampai +20%
                $oldPrice = $currentPrice / (1 + $priceChange);

                PriceHistory::create([
                    'product_id' => $product->id,
                    'old_price' => round($oldPrice, 2),
                    'new_price' => round($currentPrice, 2),
                    'changed_by' => $admin?->id,
                    'created_at' => Carbon::now()->subDays(rand(1, 90))->subHours(rand(1, 23)),
                ]);

                $currentPrice = $oldPrice;
            }
        }

        $this->command->info('Price history seeded successfully.');
    }
}
