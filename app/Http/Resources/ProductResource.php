<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'type' => $this->type,
            'description' => $this->description,
            'price' => [
                'amount' => (float) $this->price,
                'formatted' => 'Rp ' . number_format($this->price, 0, ',', '.'),
            ],
            'stock' => $this->stock,
            'min_stock' => $this->min_stock,
            'is_low_stock' => $this->stock <= ($this->min_stock ?? 0),
            'is_active' => $this->is_active,
            'price_histories' => ProductPriceHistoryResource::collection(
                $this->whenLoaded('priceHistories')
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
