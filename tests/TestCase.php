<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Test API Token untuk authentication.
     */
    protected string $testApiToken = 'test-api-token-for-testing';

    /**
     * Setup yang dijalankan sebelum setiap test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Set API token untuk testing
        config(['services.bot.api_token' => $this->testApiToken]);
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
     * Helper untuk request dengan Bearer API token.
     */
    protected function withBotToken(): static
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->testApiToken,
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
