<?php

namespace Database\Seeders;

use App\Models\Catalog;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buat katalog utama
        $mainCatalogs = [
            [
                'name' => 'Telur Ayam Segar',
                'description' => 'Koleksi telur ayam segar berkualitas tinggi dari peternakan lokal.',
                'status' => Catalog::STATUS_ACTIVE,
            ],
            [
                'name' => 'Telur Premium',
                'description' => 'Telur organik dan omega-3 untuk kebutuhan gizi terbaik.',
                'status' => Catalog::STATUS_ACTIVE,
            ],
            [
                'name' => 'Ayam Potong',
                'description' => 'Ayam potong segar siap olah untuk kebutuhan rumah tangga.',
                'status' => Catalog::STATUS_ACTIVE,
            ],
            [
                'name' => 'Paket Hemat',
                'description' => 'Paket bundling hemat untuk kebutuhan keluarga.',
                'status' => Catalog::STATUS_ACTIVE,
            ],
            [
                'name' => 'Promo Spesial',
                'description' => 'Produk dengan harga promo terbatas.',
                'status' => Catalog::STATUS_INACTIVE,
            ],
        ];

        foreach ($mainCatalogs as $catalogData) {
            Catalog::create($catalogData);
        }

        // Attach products ke catalogs jika ada
        $products = Product::all();

        if ($products->isNotEmpty()) {
            $catalogs = Catalog::active()->get();

            foreach ($catalogs as $catalog) {
                // Random attach 2-4 products ke setiap catalog
                $randomProducts = $products->random(min(rand(2, 4), $products->count()));

                foreach ($randomProducts as $index => $product) {
                    $catalog->products()->attach($product->id, [
                        'sort_order' => $index + 1,
                    ]);
                }
            }
        }
    }
}
