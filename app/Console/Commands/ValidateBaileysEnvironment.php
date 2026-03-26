<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class ValidateBaileysEnvironment extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'baileys:validate-env
                          {--fix : Automatically fix issues where possible}
                          {--production : Force production-level validation}';

    /**
     * The console command description.
     */
    protected $description = 'Validate dan security check untuk Baileys environment configuration';

    private int $errorCount = 0;

    private int $warningCount = 0;

    private array $fixes = [];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->line('🔍 Validating Baileys Environment Configuration...');
        $this->newLine();

        $this->validateCoreConfig();
        $this->validateSecurityConfig();
        $this->validateStorageConfig();
        $this->validatePerformanceConfig();
        $this->validateNetworkConfig();
        $this->validateBridge();

        $this->newLine();
        $this->displaySummary();

        return $this->errorCount > 0 ? 1 : 0;
    }

    /**
     * Validate core configuration
     */
    private function validateCoreConfig(): void
    {
        $this->info('📋 Core Configuration');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $required = [
            'BAILEYS_API_URL' => config('services.baileys.url'),
            'BAILEYS_API_KEY' => config('services.baileys.api_key'),
            'BAILEYS_SESSION_PATH' => config('services.baileys.session_path'),
            'BAILEYS_WEBHOOK_URL' => config('services.baileys.webhook_url'),
        ];

        foreach ($required as $envKey => $value) {
            if (empty($value)) {
                $this->error("✗ {$envKey} is missing");
                $this->errorCount++;
            } else {
                $this->line("<fg=green>✓</> {$envKey} is configured");
            }
        }

        // Check APP_KEY is set
        if (empty(config('app.key'))) {
            $this->error('✗ APP_KEY is missing. Run: php artisan key:generate');
            $this->errorCount++;

            if ($this->option('fix')) {
                $this->fixes[] = 'php artisan key:generate';
            }
        } else {
            $this->line('<fg=green>✓</> APP_KEY is configured');
        }

        $this->newLine();
    }

    /**
     * Validate security configuration
     */
    private function validateSecurityConfig(): void
    {
        $this->info('🔒 Security Configuration');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $isProduction = app()->environment('production') || $this->option('production');

        // API Key validation
        $apiKey = config('services.baileys.api_key');
        if ($isProduction) {
            $weakKeys = [
                'your_baileys_api_key_here',
                'your_api_key',
                'api_key',
                'test_key',
                '12345',
                'password',
                'secret',
            ];

            if (in_array($apiKey, $weakKeys) || strlen($apiKey) < 16) {
                $this->error('✗ Weak atau default API key detected');
                $this->errorCount++;
            } else {
                $this->line('<fg=green>✓</> API key strength is adequate');
            }

            // URL validation for production
            $url = config('services.baileys.url');
            if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
                $this->warn('⚠ Baileys URL menggunakan localhost di production');
                $this->warningCount++;
            } else {
                $this->line('<fg=green>✓</> Baileys URL valid untuk production');
            }

            // Rate limiting check
            if (! config('services.baileys.rate_limit_enabled', true)) {
                $this->warn('⚠ Rate limiting disabled di production');
                $this->warningCount++;
            } else {
                $this->line('<fg=green>✓</> Rate limiting enabled');
            }
        } else {
            $this->line('<fg=yellow>ⓘ</> Security validation skipped (development mode)');
        }

        // Check debug mode
        if (config('app.debug') && $isProduction) {
            $this->error('✗ APP_DEBUG=true di production environment');
            $this->errorCount++;
        } else {
            $this->line('<fg=green>✓</> Debug mode configuration appropriate');
        }

        $this->newLine();
    }

    /**
     * Validate storage configuration
     */
    private function validateStorageConfig(): void
    {
        $this->info('💾 Storage Configuration');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $paths = [
            'Session Path' => config('services.baileys.session_path', storage_path('app/baileys-sessions')),
            'Auth State' => config('baileys.auth_state_path', storage_path('app/baileys-auth')),
            'Media Path' => config('baileys.media_path', storage_path('app/baileys-media')),
            'Logs Path' => config('baileys.logs_path', storage_path('logs/baileys')),
        ];

        foreach ($paths as $name => $path) {
            if (empty($path)) {
                $this->warn("⚠ {$name} not configured");
                $this->warningCount++;

                continue;
            }

            // Check directory exists
            if (! File::exists($path)) {
                if ($this->option('fix')) {
                    File::makeDirectory($path, 0700, true);
                    $this->line("<fg=cyan>🔧</> Created {$name}: {$path}");
                    $this->fixes[] = "mkdir -p {$path}";
                } else {
                    $this->warn("⚠ {$name} directory does not exist: {$path}");
                    $this->warningCount++;
                }
            } else {
                $this->line("<fg=green>✓</> {$name} directory exists");
            }

            // Check permissions
            if (File::exists($path)) {
                if (! File::isWritable($path)) {
                    $this->error("✗ {$name} is not writable: {$path}");
                    $this->errorCount++;

                    if ($this->option('fix')) {
                        @chmod($path, 0700);
                        $this->fixes[] = "chmod 700 {$path}";
                    }
                } else {
                    $this->line("<fg=green>✓</> {$name} is writable");
                }

                // Check disk space
                $freeBytes = disk_free_space($path);
                $minBytes = 100 * 1024 * 1024; // 100MB

                if ($freeBytes !== false && $freeBytes < $minBytes) {
                    $this->warn("⚠ Low disk space for {$name}: ".round($freeBytes / 1024 / 1024, 2).'MB');
                    $this->warningCount++;
                } else {
                    $this->line("<fg=green>✓</> {$name} has sufficient disk space");
                }
            }
        }

        $this->newLine();
    }

    /**
     * Validate performance configuration
     */
    private function validatePerformanceConfig(): void
    {
        $this->info('⚡ Performance Configuration');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $timeout = config('services.baileys.timeout', 30);
        if ($timeout < 10 || $timeout > 120) {
            $this->warn("⚠ Timeout tidak optimal: {$timeout}s (recommended: 30s)");
            $this->warningCount++;
        } else {
            $this->line('<fg=green>✓</> Timeout configuration optimal');
        }

        $retryAttempts = config('services.baileys.retry_attempts', 3);
        if ($retryAttempts < 1 || $retryAttempts > 10) {
            $this->warn("⚠ Retry attempts tidak optimal: {$retryAttempts} (recommended: 3)");
            $this->warningCount++;
        } else {
            $this->line('<fg=green>✓</> Retry attempts configuration optimal');
        }

        $this->newLine();
    }

    /**
     * Validate network configuration
     */
    private function validateNetworkConfig(): void
    {
        $this->info('🌐 Network Configuration');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Test Baileys service connection
        $url = config('services.baileys.url');
        if (! empty($url)) {
            try {
                $response = Http::timeout(5)->get("{$url}/health");

                if ($response->successful()) {
                    $this->line('<fg=green>✓</> Baileys service reachable');
                } else {
                    $this->warn("⚠ Baileys service returned HTTP {$response->status()}");
                    $this->warningCount++;
                }
            } catch (\Exception $e) {
                $this->warn("⚠ Cannot reach Baileys service: {$e->getMessage()}");
                $this->warningCount++;
            }
        } else {
            $this->warn('⚠ Baileys URL not configured');
            $this->warningCount++;
        }

        // Check Redis connection for Baileys
        if (config('services.baileys.redis_host')) {
            try {
                if (! extension_loaded('redis')) {
                    $this->warn('⚠ PHP Redis extension not loaded');
                    $this->warningCount++;

                    return;
                }

                $redis = new \Redis;
                $connected = @$redis->connect(
                    config('services.baileys.redis_host'),
                    config('services.baileys.redis_port', 6379),
                    2
                );

                if ($connected) {
                    $this->line('<fg=green>✓</> Redis connection for Baileys working');
                    $redis->close();
                } else {
                    $this->warn('⚠ Cannot connect to Baileys Redis');
                    $this->warningCount++;
                }
            } catch (\Exception $e) {
                $this->warn("⚠ Redis connection error: {$e->getMessage()}");
                $this->warningCount++;
            }
        } else {
            $this->line('<fg=yellow>ⓘ</> Redis not configured for Baileys');
        }

        $this->newLine();
    }

    /**
     * Validate bridge configuration
     */
    private function validateBridge(): void
    {
        $this->info('🌉 Bridge Configuration');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (config('baileys.bridge.enabled', true)) {
            $apiUrl = config('baileys.bridge.api_url');
            $webhookUrl = config('baileys.bridge.webhook_url');

            if (empty($apiUrl) || empty($webhookUrl)) {
                $this->warn('⚠ Bridge enabled but URLs not configured');
                $this->warningCount++;
            } else {
                $this->line('<fg=green>✓</> Bridge URLs configured');
            }
        } else {
            $this->line('<fg=yellow>ⓘ</> Bridge disabled');
        }

        $this->newLine();
    }

    /**
     * Display validation summary
     */
    private function displaySummary(): void
    {
        $this->info('📊 Validation Summary');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━');

        if ($this->errorCount === 0 && $this->warningCount === 0) {
            $this->line('<fg=green>🎉 All validations passed! Environment is ready.</fg=green>');
        } else {
            if ($this->errorCount > 0) {
                $this->line("<fg=red>✗ {$this->errorCount} error(s) found</fg=red>");
            }

            if ($this->warningCount > 0) {
                $this->line("<fg=yellow>⚠ {$this->warningCount} warning(s) found</fg=yellow>");
            }
        }

        if (! empty($this->fixes)) {
            $this->newLine();
            $this->line('<fg=cyan>🔧 Applied fixes:</fg=cyan>');
            foreach ($this->fixes as $fix) {
                $this->line("   • {$fix}");
            }
        }

        $this->newLine();
        $this->line('<fg=blue>💡 Run with --fix to automatically fix issues where possible</fg=blue>');
        $this->line('<fg=blue>💡 Run with --production to force production-level validation</fg=blue>');
    }
}
