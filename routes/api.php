<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\WhatsAppStatusController;
use App\Http\Controllers\WebhookController;
use App\Models\Product;
use App\Services\BaileysService;
use Illuminate\Support\Facades\Route;

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
        'data' => [
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ],
    ]);
});

// Baileys health endpoint
Route::get('/health/baileys', function () {
    $baileys = app(BaileysService::class);
    $metrics = $baileys->getHealthMetrics();
    $status = $baileys->getConnectionStatus();

    $isHealthy = $status['status'] === 'open' && $status['authenticated'];

    return response()->json([
        'service' => 'baileys',
        'status' => $isHealthy ? 'healthy' : 'unhealthy',
        'details' => [
            'connection' => $status,
            'metrics' => $metrics,
        ],
        'timestamp' => now()->toIso8601String(),
    ], $isHealthy ? 200 : 503);
});

// Auth routes - Sanctum token-based authentication
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Baileys Auth API - disabled until controller is created
// Route::prefix('baileys')->middleware('auth:sanctum')->group(function () {
//     Route::get('/status', [BaileysAuthController::class, 'status']);
//     Route::post('/qr/request', [BaileysAuthController::class, 'requestQR']);
//     Route::get('/qr', [BaileysAuthController::class, 'getQR']);
//     Route::post('/pairing', [BaileysAuthController::class, 'requestPairing']);
//     Route::post('/logout', [BaileysAuthController::class, 'logout']);
//     Route::post('/restart', [BaileysAuthController::class, 'restart']);
//     Route::get('/metrics', [BaileysAuthController::class, 'metrics']);
// });

// ============================================================
// INTERNAL BOT API - untuk WhatsApp bot query data
// Dilindungi dengan BOT_SECRET header
// ============================================================
Route::prefix('bot')->middleware('bot.internal')->group(function () {
    // Products - read only untuk bot
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/products/search/{keyword}', function (string $keyword) {
        $products = Product::where('status', 'active')
            ->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('type', 'like', "%{$keyword}%");
            })
            ->get();

        return response()->json(['success' => true, 'data' => $products]);
    });

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);

    // Chats - untuk tracking
    Route::post('/chats', [ChatController::class, 'store']);
    Route::post('/messages', [MessageController::class, 'store']);

    // Admin operations (protected by admin phone check in bot)
    Route::post('/admin/products', [ProductController::class, 'store']);
    Route::put('/admin/products/{id}', [ProductController::class, 'update']);
    Route::patch('/admin/products/{id}/stock', [ProductController::class, 'updateStock']);
    Route::delete('/admin/products/{id}', [ProductController::class, 'destroy']);
});

// Protected routes - requires API token
Route::middleware(['api.token', 'throttle:api'])->group(function () {

    // WhatsApp Status & Management
    Route::prefix('whatsapp')->group(function () {
        Route::get('/status', [WhatsAppStatusController::class, 'status']);
        Route::get('/ready', [WhatsAppStatusController::class, 'ready']);
        Route::get('/qr', [WhatsAppStatusController::class, 'qr']);
        Route::delete('/cache', [WhatsAppStatusController::class, 'clearCache']);

        // Development only
        Route::post('/test-event', [WhatsAppStatusController::class, 'testEvent'])
            ->middleware(['throttle:5,1']); // max 5 per minute
    });

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
    // fix: tambahkan route delete untuk cancel order - 2026-03-24
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

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
