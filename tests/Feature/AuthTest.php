<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\getJson;

describe('Authentication', function () {

    describe('Health Check Endpoint', function () {
        it('returns healthy status without authentication', function () {
            $response = getJson('/api/health');

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'API is running',
                ])
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => ['status', 'timestamp'],
                ]);
        });

        it('returns healthy status as string', function () {
            $response = getJson('/api/health');

            $response->assertJsonPath('data.status', 'healthy');
        });

        it('returns valid ISO8601 timestamp', function () {
            $response = getJson('/api/health');

            $timestamp = $response->json('data.timestamp');
            expect($timestamp)->toMatch('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/');
        });
    });

    describe('User Model Authentication', function () {
        it('hashes password when creating user', function () {
            $user = User::factory()->create([
                'password' => 'plaintext123',
            ]);

            expect($user->password)->not->toBe('plaintext123');
            expect(strlen($user->password))->toBeGreaterThan(50);
        });

        it('verifies password correctly', function () {
            $user = User::factory()->create([
                'password' => 'secretpassword',
            ]);

            expect(Hash::check('secretpassword', $user->password))->toBeTrue();
            expect(Hash::check('wrongpassword', $user->password))->toBeFalse();
        });

        it('creates API token for user', function () {
            $user = User::factory()->create();
            $token = $user->createToken('test-token');

            expect($token->plainTextToken)->not->toBeEmpty();
            expect(strlen($token->plainTextToken))->toBeGreaterThan(10);
        });
    });

    describe('User Roles', function () {
        it('admin user has admin privileges', function () {
            $admin = User::factory()->admin()->create();

            expect($admin->isAdmin())->toBeTrue();
            expect($admin->role)->toBe(User::ROLE_ADMIN);
        });

        it('staff user has staff role', function () {
            $staff = User::factory()->staff()->create();

            expect($staff->isStaff())->toBeTrue();
            expect($staff->role)->toBe(User::ROLE_STAFF);
        });

        it('admin is not staff', function () {
            $admin = User::factory()->admin()->create();

            expect($admin->isStaff())->toBeFalse();
        });

        it('staff is not admin', function () {
            $staff = User::factory()->staff()->create();

            expect($staff->isAdmin())->toBeFalse();
        });
    });

    describe('User Email Verification', function () {
        it('new user has verified email by default in factory', function () {
            $user = User::factory()->create();

            expect($user->email_verified_at)->not->toBeNull();
        });

        it('unverified user has null email_verified_at', function () {
            $user = User::factory()->unverified()->create();

            expect($user->email_verified_at)->toBeNull();
        });
    });

    describe('User Active Status', function () {
        it('can query active users only', function () {
            User::factory()->create(['is_active' => true]);
            User::factory()->create(['is_active' => false]);
            User::factory()->create(['is_active' => true]);

            $activeUsers = User::active()->get();

            expect($activeUsers)->toHaveCount(2);
            $activeUsers->each(function ($user) {
                expect($user->is_active)->toBeTrue();
            });
        });
    });
});
