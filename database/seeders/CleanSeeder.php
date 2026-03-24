<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CleanSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate semua tabel (hapus dummy)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        DB::table('messages')->truncate();
        DB::table('order_items')->truncate();
        DB::table('orders')->truncate();
        DB::table('chats')->truncate();
        DB::table('catalog_products')->truncate();
        DB::table('catalogs')->truncate();
        DB::table('price_histories')->truncate();
        DB::table('products')->truncate();
        DB::table('personal_access_tokens')->truncate();
        // Jangan truncate users - butuh admin
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        $this->command->info('Semua dummy data berhasil dihapus!');
    }
}
