<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Base TestCase yang digunakan semua test.
| fix: tambahkan RefreshDatabase untuk proper database isolation - 2026-03-26
|
*/

uses(TestCase::class, RefreshDatabase::class)->in('Feature');
uses(TestCase::class, RefreshDatabase::class)->in('Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| Custom expectations untuk testing yang lebih ekspresif.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

expect()->extend('toBeValidOrderNumber', function () {
    return $this->toMatch('/^ORD-\d{8}-[A-Z0-9]{4}$/');
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| Helper functions untuk mempermudah testing.
|
*/

function createUser(array $attributes = []): User
{
    return User::factory()->create($attributes);
}

function createAdmin(): User
{
    return User::factory()->admin()->create();
}

function createProduct(array $attributes = []): Product
{
    return Product::factory()->create($attributes);
}

function createOrder(array $attributes = []): Order
{
    return Order::factory()->create($attributes);
}
