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
            'chatId' => $this->chat_id,
            'sender' => $this->getSenderType(),
            'content' => $this->content,
            'type' => $this->type,
            'direction' => $this->direction === 'in' ? 'inbound' : 'outbound',
            'createdAt' => $this->created_at->toISOString(),
        ];
    }

    /**
     * Get sender type based on direction and chat status
     */
    private function getSenderType(): string
    {
        if ($this->direction === 'in') {
            return 'customer';
        }

        // If direction is 'out', it could be bot or admin
        // Check chat status at the time (simplified)
        return $this->chat?->status === 'admin' ? 'admin' : 'bot';
    }
}
