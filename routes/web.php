<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Redirect root to dashboard
Route::get('/', fn () => redirect()->route('dashboard'));

// Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('login', [LoginController::class, 'login']);
});

Route::post('logout', [LoginController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// Authenticated Routes
Route::middleware('auth')->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Resource Routes
    Route::resource('products', ProductController::class);
    Route::resource('orders', OrderController::class);
    Route::resource('catalogs', CatalogController::class);

    // Chat Routes dengan custom actions
    Route::resource('chats', ChatController::class);
    Route::post('chats/{chat}/takeover', [ChatController::class, 'takeover'])->name('chats.takeover');
    Route::post('chats/{chat}/resolve', [ChatController::class, 'resolve'])->name('chats.resolve');

    // Baileys Auth Routes
    Route::prefix('whatsapp')->name('baileys.')->group(function () {
        Route::get('auth', [BaileysAuthController::class, 'showQR'])->name('auth');
        Route::post('auth/logout', [BaileysAuthController::class, 'logout'])->name('logout');
        Route::post('auth/restart', [BaileysAuthController::class, 'restart'])->name('restart');
    });

    // Settings (admin only)
    Route::get('settings', [SettingsController::class, 'index'])
        ->middleware('admin')
        ->name('settings');
});
