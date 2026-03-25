<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Base TestCase yang digunakan semua test.
|
*/

uses(Tests\TestCase::class)->in('Feature');
uses(Tests\TestCase::class)->in('Unit');

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

function createUser(array $attributes = []): \App\Models\User
{
    return \App\Models\User::factory()->create($attributes);
}

function createAdmin(): \App\Models\User
{
    return \App\Models\User::factory()->admin()->create();
}

function createProduct(array $attributes = []): \App\Models\Product
{
    return \App\Models\Product::factory()->create($attributes);
}

function createOrder(array $attributes = []): \App\Models\Order
{
    return \App\Models\Order::factory()->create($attributes);
}
