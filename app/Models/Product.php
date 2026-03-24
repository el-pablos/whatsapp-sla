<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    public const TYPE_TELUR = 'telur';
    public const TYPE_AYAM = 'ayam';

    public const SIZE_S = 'S';
    public const SIZE_M = 'M';
    public const SIZE_L = 'L';
    public const SIZE_XL = 'XL';

    public const UNIT_KG = 'kg';
    public const UNIT_PCS = 'pcs';
    public const UNIT_PETI = 'peti';
    public const UNIT_EKOR = 'ekor';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'name',
        'type',
        'size',
        'unit',
        'price',
        'stock',
        'image',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];

    protected $attributes = [
        'status' => self::STATUS_ACTIVE,
        'unit' => self::UNIT_KG,
        'stock' => 0,
    ];

    public static function getTypes(): array
    {
        return [
            self::TYPE_TELUR,
            self::TYPE_AYAM,
        ];
    }

    public static function getSizes(): array
    {
        return [
            self::SIZE_S,
            self::SIZE_M,
            self::SIZE_L,
            self::SIZE_XL,
        ];
    }

    public static function getUnits(): array
    {
        return [
            self::UNIT_KG,
            self::UNIT_PCS,
            self::UNIT_PETI,
            self::UNIT_EKOR,
        ];
    }

    public static function getStatuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_INACTIVE,
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeTelur(Builder $query): Builder
    {
        return $query->byType(self::TYPE_TELUR);
    }

    public function scopeAyam(Builder $query): Builder
    {
        return $query->byType(self::TYPE_AYAM);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function catalogs(): BelongsToMany
    {
        return $this->belongsToMany(Catalog::class, 'catalog_products');
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(PriceHistory::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isTelur(): bool
    {
        return $this->type === self::TYPE_TELUR;
    }

    public function isAyam(): bool
    {
        return $this->type === self::TYPE_AYAM;
    }

    public function hasStock(): bool
    {
        return $this->stock > 0;
    }
}
