<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Setup yang dijalankan sebelum setiap test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Disable exception handling untuk debugging yang lebih mudah
        // $this->withoutExceptionHandling();
    }

    /**
     * Helper untuk membuat user dengan API token.
     */
    protected function createUserWithToken(array $attributes = []): array
    {
        $user = \App\Models\User::factory()->create($attributes);
        $token = $user->createToken('test-token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    /**
     * Helper untuk request dengan API token header.
     */
    protected function withApiToken(string $token): static
    {
        return $this->withHeaders([
            'X-API-Token' => $token,
            'Accept' => 'application/json',
        ]);
    }

    /**
     * Assert bahwa response memiliki struktur API standar.
     */
    protected function assertApiResponse($response, bool $success = true, int $status = 200): void
    {
        $response->assertStatus($status);
        $response->assertJsonStructure(['success', 'message']);
        $response->assertJson(['success' => $success]);
    }
}
