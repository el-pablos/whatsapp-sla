<?php

namespace App\Services;

class WhatsAppService
{
    private BaileysService $baileys;

    public function __construct(BaileysService $baileys)
    {
        $this->baileys = $baileys;
    }

    /**
     * Send text message with auth check
     */
    public function sendText(string $to, string $text): ?string
    {
        return $this->baileys->sendMessage($to, 'text', ['text' => $text]);
    }

    /**
     * Send image message with auth check
     */
    public function sendImage(string $to, string $imageUrl, ?string $caption = null): ?string
    {
        return $this->baileys->sendMessage($to, 'image', [
            'url' => $imageUrl,
            'caption' => $caption,
        ]);
    }

    /**
     * Send interactive buttons with auth check
     */
    public function sendButton(string $to, string $text, array $buttons): ?string
    {
        return $this->baileys->sendMessage($to, 'button', [
            'text' => $text,
            'buttons' => $buttons,
        ]);
    }

    /**
     * Send interactive list with auth check
     */
    public function sendList(string $to, string $title, array $sections): ?string
    {
        return $this->baileys->sendMessage($to, 'list', [
            'title' => $title,
            'sections' => $sections,
        ]);
    }

    // Legacy method untuk backward compatibility
    public function send(string $to, string $message): ?string
    {
        return $this->sendText($to, $message);
    }

    /**
     * Get connection health untuk monitoring
     */
    public function getConnectionHealth(): array
    {
        return $this->baileys->getHealthMetrics();
    }

    /**
     * Force reconnect
     */
    public function reconnect(): array
    {
        return $this->baileys->restart();
    }

    /**
     * Check if WhatsApp is connected
     */
    public function isConnected(): bool
    {
        return $this->baileys->isConnected();
    }

    /**
     * Get connection status
     */
    public function getConnectionStatus(): array
    {
        return $this->baileys->getConnectionStatus();
    }
}
