<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculate subtotal from items
        $subtotal = $this->whenLoaded('items', function () {
            return $this->items->sum('subtotal');
        }, 0);

        return [
            'id' => $this->id,
            'customer' => [
                'phone' => $this->customer_phone,
                'name' => $this->customer_name,
            ],
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_name' => $item->product_name,
                        'quantity' => $item->quantity,
                        'price' => (float) $item->price,
                        'subtotal' => (float) $item->subtotal,
                    ];
                });
            }),
            'pricing' => [
                'total' => (float) $this->total,
                'formatted_total' => 'Rp ' . number_format($this->total ?? 0, 0, ',', '.'),
            ],
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
