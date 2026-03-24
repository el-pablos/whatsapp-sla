<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChatFactory extends Factory
{
    protected $model = Chat::class;

    public function definition(): array
    {
        $status = fake()->randomElement([Chat::STATUS_BOT, Chat::STATUS_ADMIN]);

        return [
            'customer_phone' => fake()->unique()->numerify('628##########'),
            'customer_name' => fake()->name(),
            'status' => $status,
            'handled_by' => $status === Chat::STATUS_ADMIN ? User::factory() : null,
            'last_message_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ];
    }

    /**
     * Chat handled by bot
     */
    public function bot(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Chat::STATUS_BOT,
            'handled_by' => null,
        ]);
    }

    /**
     * Chat handled by admin
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Chat::STATUS_ADMIN,
            'handled_by' => User::factory(),
        ]);
    }

    /**
     * Resolved chat
     */
    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Chat::STATUS_RESOLVED,
        ]);
    }

    /**
     * Recent chat (needs attention)
     */
    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_message_at' => fake()->dateTimeBetween('-10 minutes', 'now'),
        ]);
    }

    /**
     * Old chat
     */
    public function old(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_message_at' => fake()->dateTimeBetween('-30 days', '-7 days'),
        ]);
    }
}
