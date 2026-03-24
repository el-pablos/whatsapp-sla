<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'customer_name' => fake()->name(),
            'customer_phone' => '08' . fake()->numerify('##########'),
            'status' => fake()->randomElement(Order::statuses()),
            'total' => fake()->randomFloat(2, 50000, 1000000),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => Order::STATUS_PENDING]);
    }

    public function confirmed(): static
    {
        return $this->state(['status' => Order::STATUS_CONFIRMED]);
    }

    public function processing(): static
    {
        return $this->state(['status' => Order::STATUS_PROCESSING]);
    }

    public function completed(): static
    {
        return $this->state(['status' => Order::STATUS_COMPLETED]);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => Order::STATUS_CANCELLED]);
    }
}
