<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition(): array
    {
        return [
            'chat_id' => Chat::factory(),
            'content' => fake()->sentence(),
            'type' => Message::TYPE_TEXT,
            'direction' => fake()->randomElement([Message::DIRECTION_IN, Message::DIRECTION_OUT]),
            'wa_message_id' => fake()->optional(0.8)->uuid(),
        ];
    }

    /**
     * Incoming message (from customer)
     */
    public function incoming(): static
    {
        return $this->state(fn (array $attributes) => [
            'direction' => Message::DIRECTION_IN,
        ]);
    }

    /**
     * Outgoing message (from system)
     */
    public function outgoing(): static
    {
        return $this->state(fn (array $attributes) => [
            'direction' => Message::DIRECTION_OUT,
        ]);
    }

    /**
     * Text message
     */
    public function text(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Message::TYPE_TEXT,
            'content' => fake()->paragraph(),
        ]);
    }

    /**
     * Image message
     */
    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Message::TYPE_IMAGE,
            'content' => 'https://picsum.photos/400/300',
        ]);
    }

    /**
     * Button message
     */
    public function button(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Message::TYPE_BUTTON,
            'content' => json_encode([
                'text' => fake()->sentence(),
                'buttons' => [
                    ['id' => '1', 'title' => 'Option 1'],
                    ['id' => '2', 'title' => 'Option 2'],
                ],
            ]),
        ]);
    }

    /**
     * List message
     */
    public function list(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Message::TYPE_LIST,
            'content' => json_encode([
                'title' => 'Pilih Produk',
                'items' => [
                    ['id' => 'telur', 'title' => 'Telur Ayam', 'description' => 'Rp 28.000/kg'],
                    ['id' => 'ayam', 'title' => 'Ayam Potong', 'description' => 'Rp 35.000/kg'],
                ],
            ]),
        ]);
    }
}
