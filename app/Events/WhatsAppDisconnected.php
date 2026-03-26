<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event dipicu ketika WhatsApp terputus dari Baileys service
 */
class WhatsAppDisconnected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $status;

    public \DateTime $disconnectedAt;

    /**
     * Buat instance event baru
     */
    public function __construct(array $status)
    {
        $this->status = $status;
        $this->disconnectedAt = now();
    }
}
