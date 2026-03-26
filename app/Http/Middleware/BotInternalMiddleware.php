<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware untuk internal bot API
 * Memvalidasi BOT_SECRET header
 */
class BotInternalMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = $request->header('X-Bot-Secret');
        $expectedSecret = config('services.bot.internal_secret');

        if (! $secret || $secret !== $expectedSecret) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid bot secret',
                'code' => 'UNAUTHORIZED',
            ], 401);
        }

        return $next($request);
    }
}
