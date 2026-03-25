<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenMiddleware
{
    /**
     * Handle an incoming request.
     * Validates Bearer token from API_BOT_TOKEN environment variable.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak ditemukan',
                'code'    => 'MISSING_TOKEN',
            ], 401);
        }

        $validToken = config('services.bot.api_token');

        if (!$validToken || !hash_equals($validToken, $token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid',
                'code'    => 'INVALID_TOKEN',
            ], 401);
        }

        return $next($request);
    }
}
