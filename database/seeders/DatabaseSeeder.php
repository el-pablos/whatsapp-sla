<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ProductSeeder::class,
            CatalogSeeder::class,
            PriceHistorySeeder::class,
            ChatSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
