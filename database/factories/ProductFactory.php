<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $type = fake()->randomElement(Product::getTypes());
        $size = $type === Product::TYPE_TELUR
            ? fake()->randomElement(Product::getSizes())
            : null;

        $unit = $type === Product::TYPE_TELUR
            ? fake()->randomElement([Product::UNIT_PCS, Product::UNIT_PETI])
            : fake()->randomElement([Product::UNIT_KG, Product::UNIT_EKOR]);

        $names = $type === Product::TYPE_TELUR
            ? ['Telur Ayam Negeri', 'Telur Ayam Kampung', 'Telur Ayam Omega', 'Telur Ayam Premium']
            : ['Ayam Broiler', 'Ayam Kampung', 'Ayam Potong', 'Ayam Pejantan', 'Ayam Fillet'];

        return [
            'name' => fake()->randomElement($names),
            'type' => $type,
            'size' => $size,
            'unit' => $unit,
            'price' => fake()->numberBetween(15000, 100000),
            'stock' => fake()->numberBetween(0, 500),
            'image' => null,
            'status' => Product::STATUS_ACTIVE,
        ];
    }

    public function telur(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Product::TYPE_TELUR,
            'size' => fake()->randomElement(Product::getSizes()),
            'unit' => fake()->randomElement([Product::UNIT_PCS, Product::UNIT_PETI]),
        ]);
    }

    public function ayam(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Product::TYPE_AYAM,
            'size' => null,
            'unit' => fake()->randomElement([Product::UNIT_KG, Product::UNIT_EKOR]),
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Product::STATUS_ACTIVE,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Product::STATUS_INACTIVE,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }

    public function withStock(int $stock): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => $stock,
        ]);
    }
}
