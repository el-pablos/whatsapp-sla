<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Produk Telur
            [
                'name' => 'Telur Ayam Negeri',
                'type' => Product::TYPE_TELUR,
                'size' => Product::SIZE_M,
                'unit' => Product::UNIT_PETI,
                'price' => 45000,
                'stock' => 100,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Telur Ayam Negeri',
                'type' => Product::TYPE_TELUR,
                'size' => Product::SIZE_L,
                'unit' => Product::UNIT_PETI,
                'price' => 50000,
                'stock' => 80,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Telur Ayam Negeri',
                'type' => Product::TYPE_TELUR,
                'size' => Product::SIZE_XL,
                'unit' => Product::UNIT_PETI,
                'price' => 55000,
                'stock' => 50,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Telur Ayam Kampung',
                'type' => Product::TYPE_TELUR,
                'size' => Product::SIZE_S,
                'unit' => Product::UNIT_PCS,
                'price' => 3000,
                'stock' => 200,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Telur Ayam Omega',
                'type' => Product::TYPE_TELUR,
                'size' => Product::SIZE_L,
                'unit' => Product::UNIT_PCS,
                'price' => 3500,
                'stock' => 150,
                'status' => Product::STATUS_ACTIVE,
            ],

            // Produk Ayam
            [
                'name' => 'Ayam Broiler Utuh',
                'type' => Product::TYPE_AYAM,
                'size' => null,
                'unit' => Product::UNIT_EKOR,
                'price' => 45000,
                'stock' => 50,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Ayam Broiler Potong',
                'type' => Product::TYPE_AYAM,
                'size' => null,
                'unit' => Product::UNIT_KG,
                'price' => 35000,
                'stock' => 100,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Ayam Kampung',
                'type' => Product::TYPE_AYAM,
                'size' => null,
                'unit' => Product::UNIT_EKOR,
                'price' => 85000,
                'stock' => 30,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Daging Ayam Fillet',
                'type' => Product::TYPE_AYAM,
                'size' => null,
                'unit' => Product::UNIT_KG,
                'price' => 55000,
                'stock' => 40,
                'status' => Product::STATUS_ACTIVE,
            ],
            [
                'name' => 'Ayam Pejantan',
                'type' => Product::TYPE_AYAM,
                'size' => null,
                'unit' => Product::UNIT_EKOR,
                'price' => 40000,
                'stock' => 25,
                'status' => Product::STATUS_ACTIVE,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
