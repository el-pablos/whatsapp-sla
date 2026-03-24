<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\CatalogController;

/*
|--------------------------------------------------------------------------
| API Routes for WhatsApp SLA Bot
|--------------------------------------------------------------------------
|
| Routes ini digunakan oleh Python bot untuk komunikasi dengan Laravel.
| Semua routes dilindungi dengan API token authentication.
|
*/

// WhatsApp Webhook Routes - no auth required (verified via hub.verify_token)
Route::prefix('webhook')->group(function () {
    Route::get('/', [WebhookController::class, 'verify'])->name('webhook.verify');
    Route::post('/', [WebhookController::class, 'receive'])->name('webhook.receive');
});

// Health check - tanpa auth untuk monitoring
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'data'    => [
            'status'    => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ],
    ]);
});

// Auth routes - Sanctum token-based authentication
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Protected routes - requires API token
Route::middleware(['api.token', 'throttle:api'])->group(function () {

    // Products
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
        Route::get('/{id}', [ProductController::class, 'show']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
        Route::patch('/{id}/stock', [ProductController::class, 'updateStock']);
        Route::get('/type/{type}', [ProductController::class, 'byType']);
    });

    // Stock
    Route::get('/stock/{product_id}', [StockController::class, 'show']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // Chats
    Route::get('/chats', [ChatController::class, 'index']);
    Route::get('/chats/{id}', [ChatController::class, 'show']);
    Route::patch('/chats/{id}', [ChatController::class, 'update']);
    Route::post('/chats', [ChatController::class, 'store']);

    // Messages
    Route::post('/messages', [MessageController::class, 'store']);

    // Catalogs
    Route::get('/catalogs', [CatalogController::class, 'index']);
    Route::get('/catalogs/{id}', [CatalogController::class, 'show']);
    Route::post('/catalogs', [CatalogController::class, 'store']);
});
