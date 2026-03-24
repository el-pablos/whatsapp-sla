<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceHistory extends Model
{
    use HasFactory;

    protected $table = 'price_histories';

    protected $fillable = [
        'product_id',
        'old_price',
        'new_price',
        'changed_by',
    ];

    protected $casts = [
        'old_price' => 'decimal:2',
        'new_price' => 'decimal:2',
    ];

    /**
     * Relasi ke product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relasi ke user yang mengubah harga
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Alias untuk user() - lebih deskriptif
     */
    public function changedBy(): BelongsTo
    {
        return $this->user();
    }

    /**
     * Hitung persentase perubahan harga
     */
    public function getPriceChangePercentageAttribute(): float
    {
        if ($this->old_price == 0) {
            return 100;
        }

        return round((($this->new_price - $this->old_price) / $this->old_price) * 100, 2);
    }

    /**
     * Hitung selisih harga
     */
    public function getPriceDifferenceAttribute(): float
    {
        return $this->new_price - $this->old_price;
    }

    /**
     * Check apakah harga naik
     */
    public function isPriceIncrease(): bool
    {
        return $this->new_price > $this->old_price;
    }

    /**
     * Check apakah harga turun
     */
    public function isPriceDecrease(): bool
    {
        return $this->new_price < $this->old_price;
    }

    /**
     * Format perubahan untuk display
     */
    public function getFormattedChangeAttribute(): string
    {
        $oldFormatted = number_format($this->old_price, 0, ',', '.');
        $newFormatted = number_format($this->new_price, 0, ',', '.');
        $percentage = $this->price_change_percentage;

        $direction = $this->isPriceIncrease() ? '+' : '';

        return "Rp {$oldFormatted} -> Rp {$newFormatted} ({$direction}{$percentage}%)";
    }

    /**
     * Scope untuk filter berdasarkan product
     */
    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope untuk filter berdasarkan periode
     */
    public function scopeInPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
