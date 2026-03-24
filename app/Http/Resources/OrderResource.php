<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer' => [
                'phone' => $this->customer_phone,
                'name' => $this->customer_name,
            ],
            'items' => $this->items,
            'pricing' => [
                'subtotal' => (float) $this->subtotal,
                'discount' => (float) $this->discount,
                'total' => (float) $this->total,
                'formatted_total' => 'Rp ' . number_format($this->total, 0, ',', '.'),
            ],
            'status' => $this->status,
            'notes' => $this->notes,
            'source' => $this->source,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
