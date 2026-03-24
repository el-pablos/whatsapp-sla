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
            'handled_by' => $this->handled_by,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
                'avatar' => $this->customer?->avatar_url,
            ],
            'assigned_admin' => $this->when($this->assignedAdmin, [
                'id' => $this->assignedAdmin?->id,
                'name' => $this->assignedAdmin?->name,
            ]),
            'last_message' => $this->when($this->lastMessage, fn() => [
                'content' => $this->lastMessage->content,
                'sender_type' => $this->lastMessage->sender_type,
                'created_at' => $this->lastMessage->created_at->toISOString(),
            ]),
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
            'messages_count' => $this->when(isset($this->messages_count), $this->messages_count),
            'unread_count' => $this->unread_count ?? 0,
            'last_message_at' => $this->last_message_at?->toISOString(),
            'takeover_at' => $this->takeover_at?->toISOString(),
            'resolved_at' => $this->resolved_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
