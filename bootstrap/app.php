<?php

use App\Http\Middleware\ApiTokenMiddleware;
use App\Http\Middleware\BotInternalMiddleware;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['sidebar_state']);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'api.token' => ApiTokenMiddleware::class,
            'bot.internal' => BotInternalMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->booted(function (Application $app) {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->bearerToken() ?: $request->ip());
        });

        RateLimiter::for('orders', function (Request $request) {
            return Limit::perMinute(30)->by($request->bearerToken() ?: $request->ip());
        });
    })
    ->create();
