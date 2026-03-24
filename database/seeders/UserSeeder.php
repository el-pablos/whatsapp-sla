<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create default admin user
        User::updateOrCreate(
            ['email' => 'admin@whatsapp-sla.local'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'phone' => '+6281234567890',
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        // Create sample staff users
        User::factory()->count(5)->staff()->create();
    }
}
