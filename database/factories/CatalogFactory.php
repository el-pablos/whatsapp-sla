<?php

namespace Database\Factories;

use App\Models\Catalog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Catalog>
 */
class CatalogFactory extends Factory
{
    protected $model = Catalog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $catalogs = [
            'Telur Ayam Segar',
            'Telur Organik Premium',
            'Ayam Potong Segar',
            'Paket Hemat Keluarga',
            'Produk Unggulan',
        ];

        return [
            'name' => fake()->randomElement($catalogs) . ' - ' . fake()->numberBetween(1, 100),
            'image' => null,
            'description' => fake()->sentence(10),
            'status' => fake()->randomElement([Catalog::STATUS_ACTIVE, Catalog::STATUS_INACTIVE]),
        ];
    }

    /**
     * Indicate that the catalog is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Catalog::STATUS_ACTIVE,
        ]);
    }

    /**
     * Indicate that the catalog is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Catalog::STATUS_INACTIVE,
        ]);
    }

    /**
     * Indicate that the catalog has an image.
     */
    public function withImage(): static
    {
        return $this->state(fn (array $attributes) => [
            'image' => 'catalogs/' . fake()->uuid() . '.jpg',
        ]);
    }
}
