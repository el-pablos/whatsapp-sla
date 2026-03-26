<?php

namespace App\Providers;

use App\Services\BaileysService;
use Illuminate\Support\Facades\File;
use Illuminate\Support\ServiceProvider;

class BaileysServiceProvider extends ServiceProvider
{
    /**
     * Register Baileys services
     */
    public function register(): void
    {
        $this->app->singleton(BaileysService::class, function ($app) {
            return new BaileysService;
        });

        $this->app->alias(BaileysService::class, 'baileys');
    }

    /**
     * Bootstrap Baileys services
     */
    public function boot(): void
    {
        $this->validateBaileysEnvironment();
        $this->ensureBaileysDirectories();
        $this->registerBaileysConfig();
    }

    /**
     * Validate Baileys-specific environment requirements
     */
    private function validateBaileysEnvironment(): void
    {
        // Skip validation during certain artisan commands
        if ($this->shouldSkipValidation()) {
            return;
        }

        // Check Node.js availability (required for Baileys)
        if (! $this->isNodeAvailable()) {
            \Log::warning('Node.js not available - Baileys integration disabled');

            return;
        }

        // Validate core Baileys configuration
        $this->validateCoreConfig();
        $this->validateSecurityConfig();
        $this->validatePerformanceConfig();
        $this->validateStoragePaths();
    }

    /**
     * Check if validation should be skipped
     */
    private function shouldSkipValidation(): bool
    {
        $skipCommands = [
            'config:cache', 'config:clear', 'cache:clear', 'migrate',
            'migrate:fresh', 'db:seed', 'queue:work', 'schedule:run',
            'package:discover', 'key:generate', 'optimize', 'optimize:clear',
            'view:clear', 'route:clear', 'storage:link',
        ];

        if ($this->app->runningInConsole()) {
            $command = $_SERVER['argv'][1] ?? '';

            return collect($skipCommands)->contains(fn ($skip) => str_contains($command, $skip));
        }

        return false;
    }

    /**
     * Validate core configuration
     */
    private function validateCoreConfig(): void
    {
        $required = [
            'services.baileys.url' => 'BAILEYS_API_URL',
            'services.baileys.api_key' => 'BAILEYS_API_KEY',
            'services.baileys.session_path' => 'BAILEYS_SESSION_PATH',
        ];

        $missing = [];
        foreach ($required as $configKey => $envKey) {
            if (empty(config($configKey))) {
                $missing[] = $envKey;
            }
        }

        if (! empty($missing)) {
            $message = 'Missing required Baileys configuration: '.implode(', ', $missing);

            if (app()->environment('production')) {
                throw new \RuntimeException($message);
            }

            \Log::warning($message);
        }
    }

    /**
     * Validate security configuration
     */
    private function validateSecurityConfig(): void
    {
        if (! app()->environment('production')) {
            return;
        }

        // API key should not be default
        if (in_array(config('services.baileys.api_key'), [
            'your_baileys_api_key_here', 'your_api_key', 'api_key', '',
        ])) {
            throw new \RuntimeException('Baileys API key menggunakan value default/kosong di production');
        }

        // URL should not point to localhost in production
        $url = config('services.baileys.url', '');
        if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
            \Log::warning('Baileys URL menggunakan localhost di production environment', ['url' => $url]);
        }

        // Rate limiting should be enabled
        if (! config('services.baileys.rate_limit_enabled', true)) {
            \Log::warning('Baileys rate limiting disabled di production environment');
        }
    }

    /**
     * Validate performance configuration
     */
    private function validatePerformanceConfig(): void
    {
        $timeout = config('services.baileys.timeout', 30);
        if ($timeout < 10 || $timeout > 120) {
            \Log::warning('Baileys timeout tidak optimal', ['timeout' => $timeout, 'recommended' => '30']);
        }

        $retryAttempts = config('services.baileys.retry_attempts', 3);
        if ($retryAttempts < 1 || $retryAttempts > 10) {
            \Log::warning('Baileys retry attempts tidak optimal', ['attempts' => $retryAttempts, 'recommended' => '3']);
        }
    }

    /**
     * Validate storage paths
     */
    private function validateStoragePaths(): void
    {
        $sessionPath = config('services.baileys.session_path', 'app/baileys-sessions');
        $fullSessionPath = storage_path($sessionPath);

        if (! File::isWritable(dirname($fullSessionPath))) {
            throw new \RuntimeException(
                "Baileys session directory not writable: {$fullSessionPath}. ".
                'Check permissions for storage directory.'
            );
        }

        // Check disk space (minimum 100MB untuk sessions)
        $freeBytes = disk_free_space(dirname($fullSessionPath));
        $minBytes = 100 * 1024 * 1024; // 100MB

        if ($freeBytes !== false && $freeBytes < $minBytes) {
            \Log::error('Insufficient disk space untuk Baileys sessions', [
                'available_mb' => round($freeBytes / 1024 / 1024, 2),
                'required_mb' => 100,
            ]);
        }
    }

    /**
     * Check if Node.js is available
     */
    private function isNodeAvailable(): bool
    {
        $output = [];
        $returnVar = 0;
        exec('which node 2>/dev/null', $output, $returnVar);

        return $returnVar === 0 && ! empty($output);
    }

    /**
     * Ensure required Baileys directories exist
     */
    private function ensureBaileysDirectories(): void
    {
        $directories = [
            config('baileys.session_path', storage_path('app/baileys-sessions')),
            config('baileys.auth_state_path', storage_path('app/baileys-auth')),
            config('baileys.media_path', storage_path('app/baileys-media')),
            config('baileys.logs_path', storage_path('logs/baileys')),
        ];

        foreach ($directories as $dir) {
            if (! File::exists($dir)) {
                File::makeDirectory($dir, 0755, true);
                \Log::info("Created Baileys directory: {$dir}");
            }
        }

        // Create .gitignore for session data security
        $sessionPath = config('baileys.session_path', storage_path('app/baileys-sessions'));
        $gitignorePath = $sessionPath.'/.gitignore';

        if (! File::exists($gitignorePath)) {
            File::put($gitignorePath, "*\n!.gitignore\n");
        }
    }

    /**
     * Register Baileys configuration
     */
    private function registerBaileysConfig(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../../config/baileys.php', 'baileys'
        );
    }

    /**
     * Get the services provided by the provider
     */
    public function provides(): array
    {
        return [BaileysService::class, 'baileys'];
    }
}
