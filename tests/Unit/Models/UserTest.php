<?php

use App\Models\User;

describe('User Model', function () {

    describe('constants', function () {
        it('has ROLE_ADMIN constant', function () {
            expect(User::ROLE_ADMIN)->toBe('admin');
        });

        it('has ROLE_STAFF constant', function () {
            expect(User::ROLE_STAFF)->toBe('staff');
        });
    });

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $user = new User();
            $fillable = $user->getFillable();

            expect($fillable)->toContain('name')
                ->toContain('email')
                ->toContain('phone')
                ->toContain('password')
                ->toContain('role')
                ->toContain('is_active');
        });
    });

    describe('hidden attributes', function () {
        it('hides password and remember_token', function () {
            $user = new User();
            $hidden = $user->getHidden();

            expect($hidden)->toContain('password')
                ->toContain('remember_token');
        });
    });

    describe('casts', function () {
        it('casts is_active to boolean', function () {
            $user = User::factory()->make(['is_active' => 1]);
            expect($user->is_active)->toBeBool();
        });

        it('casts email_verified_at to datetime', function () {
            $user = User::factory()->make();
            $casts = $user->getCasts();
            expect($casts['email_verified_at'])->toBe('datetime');
        });
    });

    describe('role methods', function () {
        it('correctly identifies admin user', function () {
            $user = User::factory()->admin()->make();
            expect($user->isAdmin())->toBeTrue();
            expect($user->isStaff())->toBeFalse();
        });

        it('correctly identifies staff user', function () {
            $user = User::factory()->staff()->make();
            expect($user->isStaff())->toBeTrue();
            expect($user->isAdmin())->toBeFalse();
        });

        it('correctly identifies customer user', function () {
            $user = User::factory()->make(['role' => 'customer']);
            expect($user->isCustomer())->toBeTrue();
            expect($user->isAdmin())->toBeFalse();
        });
    });

    describe('scopes', function () {
        it('scopeActive filters active users only', function () {
            User::factory()->create(['is_active' => true]);
            User::factory()->create(['is_active' => false]);

            $activeUsers = User::active()->get();
            expect($activeUsers)->toHaveCount(1);
            expect($activeUsers->first()->is_active)->toBeTrue();
        });

        it('scopeAdmins filters admin users only', function () {
            User::factory()->admin()->create();
            User::factory()->staff()->create();

            $admins = User::admins()->get();
            expect($admins)->toHaveCount(1);
            expect($admins->first()->role)->toBe(User::ROLE_ADMIN);
        });

        it('scopeCustomers filters customer users only', function () {
            User::factory()->create(['role' => 'customer']);
            User::factory()->admin()->create();

            $customers = User::customers()->get();
            expect($customers)->toHaveCount(1);
            expect($customers->first()->role)->toBe('customer');
        });
    });

    describe('factory', function () {
        it('creates a valid user', function () {
            $user = User::factory()->create();

            expect($user->id)->not->toBeNull();
            expect($user->name)->not->toBeEmpty();
            expect($user->email)->toContain('@');
        });

        it('creates admin with admin state', function () {
            $admin = User::factory()->admin()->create();
            expect($admin->role)->toBe(User::ROLE_ADMIN);
        });

        it('creates staff with staff state', function () {
            $staff = User::factory()->staff()->create();
            expect($staff->role)->toBe(User::ROLE_STAFF);
        });

        it('creates unverified user with unverified state', function () {
            $user = User::factory()->unverified()->create();
            expect($user->email_verified_at)->toBeNull();
        });
    });
});
