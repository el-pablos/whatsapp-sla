<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'handledBy' => $this->handled_by,
            'customer' => [
                'id' => $this->id, // No separate customer ID, using chat ID as proxy
                'name' => $this->customer_name ?? 'Customer',
                'phone' => $this->customer_phone,
                'avatar' => null,
            ],
            'assignedAdmin' => $this->when($this->handler, fn() => [
                'id' => $this->handler->id,
                'name' => $this->handler->name,
            ]),
            'lastMessage' => $this->when($this->latestMessage, fn() => [
                'content' => $this->latestMessage->content,
                'type' => $this->latestMessage->type,
                'direction' => $this->latestMessage->direction === 'in' ? 'inbound' : 'outbound',
                'createdAt' => $this->latestMessage->created_at->toISOString(),
            ]),
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
            'messagesCount' => $this->when(isset($this->messages_count), $this->messages_count),
            'unreadCount' => $this->unread_count ?? 0,
            'lastMessageAt' => $this->last_message_at?->toISOString(),
            'createdAt' => $this->created_at->toISOString(),
            'updatedAt' => $this->updated_at->toISOString(),
        ];
    }
}
