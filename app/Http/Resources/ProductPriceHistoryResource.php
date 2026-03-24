<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductPriceHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'old_price' => [
                'amount' => (float) $this->old_price,
                'formatted' => 'Rp ' . number_format($this->old_price, 0, ',', '.'),
            ],
            'new_price' => [
                'amount' => (float) $this->new_price,
                'formatted' => 'Rp ' . number_format($this->new_price, 0, ',', '.'),
            ],
            'changed_by' => $this->whenLoaded('changedBy', fn() => [
                'id' => $this->changedBy->id,
                'name' => $this->changedBy->name,
            ]),
            'reason' => $this->reason,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
