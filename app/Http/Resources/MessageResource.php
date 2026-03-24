<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chat_id' => $this->chat_id,
            'sender_type' => $this->sender_type,
            'sender' => $this->getSenderInfo(),
            'content' => $this->content,
            'message_type' => $this->message_type,
            'attachments' => $this->when($this->attachments, fn() => $this->attachments->map(fn($a) => [
                'id' => $a->id,
                'file_name' => $a->file_name,
                'file_type' => $a->file_type,
                'file_size' => $a->file_size,
                'url' => asset('storage/' . $a->file_path),
            ])),
            'is_read' => $this->is_read ?? false,
            'read_at' => $this->read_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
        ];
    }

    /**
     * Get sender information based on sender type
     */
    private function getSenderInfo(): array
    {
        return match ($this->sender_type) {
            'customer' => [
                'type' => 'customer',
                'id' => $this->chat?->customer?->id,
                'name' => $this->chat?->customer?->name,
            ],
            'admin' => [
                'type' => 'admin',
                'id' => $this->sender_id,
                'name' => $this->sender?->name ?? 'Admin',
            ],
            'bot' => [
                'type' => 'bot',
                'id' => null,
                'name' => 'Bot Assistant',
            ],
            default => [
                'type' => 'unknown',
                'id' => null,
                'name' => 'Unknown',
            ],
        };
    }
}
