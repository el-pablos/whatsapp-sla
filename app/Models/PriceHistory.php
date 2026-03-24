<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'old_price',
        'new_price',
        'changed_by',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'old_price' => 'decimal:2',
            'new_price' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    public function getPriceChange(): float
    {
        return $this->new_price - $this->old_price;
    }

    public function getPriceChangePercentage(): float
    {
        if ($this->old_price == 0) {
            return 0;
        }
        return (($this->new_price - $this->old_price) / $this->old_price) * 100;
    }
}
