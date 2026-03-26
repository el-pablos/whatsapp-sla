<?php

namespace App\Providers;

use App\Events\WhatsAppAuthStatusChanged;
use App\Events\WhatsAppConnectionStatusChanged;
use App\Events\WhatsAppDisconnected;
use App\Events\WhatsAppMessageReceived;
use App\Listeners\HandleWhatsAppAuthStatus;
use App\Listeners\HandleWhatsAppConnectionStatus;
use App\Listeners\HandleWhatsAppDisconnected;
use App\Listeners\ProcessWhatsAppMessage;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        WhatsAppMessageReceived::class => [
            ProcessWhatsAppMessage::class,
        ],

        WhatsAppAuthStatusChanged::class => [
            HandleWhatsAppAuthStatus::class,
        ],

        WhatsAppConnectionStatusChanged::class => [
            HandleWhatsAppConnectionStatus::class,
        ],

        WhatsAppDisconnected::class => [
            HandleWhatsAppDisconnected::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
