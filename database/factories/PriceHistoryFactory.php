<?php

namespace Database\Factories;

use App\Models\PriceHistory;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PriceHistory>
 */
class PriceHistoryFactory extends Factory
{
    protected $model = PriceHistory::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $oldPrice = fake()->numberBetween(10000, 100000);
        $changePercent = fake()->numberBetween(-20, 30) / 100;
        $newPrice = $oldPrice * (1 + $changePercent);

        return [
            'product_id' => Product::factory(),
            'old_price' => $oldPrice,
            'new_price' => round($newPrice, 2),
            'changed_by' => User::factory(),
        ];
    }

    /**
     * Indicate that the price increased.
     */
    public function priceIncrease(): static
    {
        return $this->state(function (array $attributes) {
            $oldPrice = $attributes['old_price'] ?? fake()->numberBetween(10000, 100000);
            $increasePercent = fake()->numberBetween(5, 30) / 100;

            return [
                'old_price' => $oldPrice,
                'new_price' => round($oldPrice * (1 + $increasePercent), 2),
            ];
        });
    }

    /**
     * Indicate that the price decreased.
     */
    public function priceDecrease(): static
    {
        return $this->state(function (array $attributes) {
            $oldPrice = $attributes['old_price'] ?? fake()->numberBetween(10000, 100000);
            $decreasePercent = fake()->numberBetween(5, 20) / 100;

            return [
                'old_price' => $oldPrice,
                'new_price' => round($oldPrice * (1 - $decreasePercent), 2),
            ];
        });
    }

    /**
     * Indicate that the history was changed by a specific user.
     */
    public function changedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'changed_by' => $user->id,
        ]);
    }

    /**
     * Indicate that the history belongs to a specific product.
     */
    public function forProduct(Product $product): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
        ]);
    }
}
