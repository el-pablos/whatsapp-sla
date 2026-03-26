<?php

namespace App\Providers;

use App\Services\BaileysService;
use Illuminate\Support\ServiceProvider;

class BaileysServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(BaileysService::class, function ($app) {
            return new BaileysService;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->validateConfiguration();
    }

    /**
     * Validate required Baileys configuration at startup
     */
    private function validateConfiguration(): void
    {
        $required = [
            'BAILEYS_SERVICE_URL' => config('services.baileys.url'),
            'BAILEYS_SESSION_PATH' => config('services.baileys.session_path'),
        ];

        $missing = [];

        foreach ($required as $key => $value) {
            if (empty($value)) {
                $missing[] = $key;
            }
        }

        if (! empty($missing)) {
            if (app()->environment('production')) {
                throw new \RuntimeException(
                    'Missing required Baileys configuration: '.implode(', ', $missing)
                );
            }

            logger()->warning('Missing Baileys configuration', ['missing' => $missing]);
        }

        // Validate session path is writable
        $sessionPath = config('services.baileys.session_path');
        if ($sessionPath) {
            $fullPath = storage_path($sessionPath);

            if (! is_dir($fullPath)) {
                @mkdir($fullPath, 0700, true);
            }

            if (! is_writable($fullPath)) {
                throw new \RuntimeException(
                    "Baileys session path is not writable: {$fullPath}"
                );
            }
        }

        // Validate Redis connection for Baileys
        if (config('services.baileys.redis_host')) {
            try {
                $redis = new \Redis;
                $redis->connect(
                    config('services.baileys.redis_host'),
                    config('services.baileys.redis_port', 6379),
                    2 // timeout
                );

                if ($password = config('services.baileys.redis_password')) {
                    $redis->auth($password);
                }

                $redis->ping();
                $redis->close();
            } catch (\Exception $e) {
                logger()->error('Baileys Redis connection failed', [
                    'error' => $e->getMessage(),
                ]);

                if (app()->environment('production')) {
                    throw new \RuntimeException(
                        'Baileys Redis connection failed: '.$e->getMessage()
                    );
                }
            }
        }
    }
}
