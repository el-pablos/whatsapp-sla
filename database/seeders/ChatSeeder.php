<?php

namespace Database\Seeders;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        // Get admin users
        $admins = User::where('role', 'admin')->get();

        if ($admins->isEmpty()) {
            $admins = User::factory()->count(2)->create(['role' => 'admin']);
        }

        // Create 10 chats handled by bot with messages
        Chat::factory()
            ->count(10)
            ->bot()
            ->recent()
            ->create()
            ->each(function (Chat $chat) {
                // Create 3-8 messages per chat
                $messageCount = rand(3, 8);

                for ($i = 0; $i < $messageCount; $i++) {
                    Message::factory()->create([
                        'chat_id' => $chat->id,
                        'direction' => $i % 2 === 0 ? Message::DIRECTION_IN : Message::DIRECTION_OUT,
                        'created_at' => now()->subMinutes($messageCount - $i),
                    ]);
                }
            });

        // Create 5 chats handled by admin
        Chat::factory()
            ->count(5)
            ->create([
                'status' => Chat::STATUS_ADMIN,
                'handled_by' => $admins->random()->id,
            ])
            ->each(function (Chat $chat) {
                $messageCount = rand(5, 12);

                for ($i = 0; $i < $messageCount; $i++) {
                    Message::factory()->create([
                        'chat_id' => $chat->id,
                        'direction' => $i % 2 === 0 ? Message::DIRECTION_IN : Message::DIRECTION_OUT,
                        'created_at' => now()->subMinutes($messageCount - $i),
                    ]);
                }
            });

        // Create 3 resolved chats
        Chat::factory()
            ->count(3)
            ->resolved()
            ->old()
            ->create()
            ->each(function (Chat $chat) {
                $messageCount = rand(10, 20);

                for ($i = 0; $i < $messageCount; $i++) {
                    Message::factory()->create([
                        'chat_id' => $chat->id,
                        'direction' => $i % 2 === 0 ? Message::DIRECTION_IN : Message::DIRECTION_OUT,
                        'created_at' => now()->subDays(rand(7, 30))->subMinutes($messageCount - $i),
                    ]);
                }
            });
    }
}
