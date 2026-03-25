<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Catalog extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'image',
        'description',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    /**
     * Status katalog yang tersedia
     */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    /**
     * Scope untuk katalog aktif
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope untuk katalog inactive
     */
    public function scopeInactive($query)
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    /**
     * Relasi ke products (many-to-many)
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'catalog_products')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    /**
     * Generate format WhatsApp untuk katalog
     */
    public function generateWhatsAppFormat(): string
    {
        $output = "*{$this->name}*\n";
        $output .= str_repeat('-', 20) . "\n";

        if ($this->description) {
            $output .= "_{$this->description}_\n\n";
        }

        $products = $this->products()->where('status', 'active')->get();

        if ($products->isEmpty()) {
            $output .= "Belum ada produk tersedia.\n";
            return $output;
        }

        foreach ($products as $index => $product) {
            $no = $index + 1;
            $price = number_format($product->price, 0, ',', '.');
            $unit = $product->unit ?? 'pcs';

            $output .= "{$no}. *{$product->name}*\n";
            $output .= "   Harga: Rp {$price}/{$unit}\n";

            if ($product->stock > 0) {
                $output .= "   Stok: {$product->stock} {$unit}\n";
            } else {
                $output .= "   _Stok habis_\n";
            }
            $output .= "\n";
        }

        $output .= str_repeat('-', 20) . "\n";
        $output .= "Ketik nomor produk untuk memesan.";

        return $output;
    }

    /**
     * Check apakah katalog aktif
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
