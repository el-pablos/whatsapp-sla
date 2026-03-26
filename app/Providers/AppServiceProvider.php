<?php

namespace App\Providers;

use App\Services\BaileysService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register BaileysService sebagai singleton
        $this->app->singleton(BaileysService::class, function ($app) {
            return new BaileysService;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->validateWhatsAppConfiguration();
    }

    /**
     * Validate critical WhatsApp configuration at startup
     * Prevents silent failures identified in env-config discovery
     */
    private function validateWhatsAppConfiguration(): void
    {
        if (app()->environment('production')) {
            $requiredConfigs = [
                'services.whatsapp.phone_number_id' => 'WA_PHONE_NUMBER_ID',
                'services.whatsapp.access_token' => 'WA_ACCESS_TOKEN',
                'services.bot.api_token' => 'API_BOT_TOKEN',
            ];

            $missing = [];
            foreach ($requiredConfigs as $configKey => $envName) {
                if (empty(config($configKey))) {
                    $missing[] = $envName;
                }
            }

            if (! empty($missing)) {
                throw new \RuntimeException(
                    'Missing required WhatsApp configuration: '.implode(', ', $missing).
                    '. Set these environment variables for production deployment.'
                );
            }

            // Validate token formats
            $phoneNumberId = config('services.whatsapp.phone_number_id');
            if ($phoneNumberId && ! ctype_digit($phoneNumberId)) {
                throw new \RuntimeException('WA_PHONE_NUMBER_ID must be numeric');
            }

            $accessToken = config('services.whatsapp.access_token');
            if ($accessToken && strlen($accessToken) < 50) {
                throw new \RuntimeException('WA_ACCESS_TOKEN appears invalid (too short)');
            }
        }
    }
}
