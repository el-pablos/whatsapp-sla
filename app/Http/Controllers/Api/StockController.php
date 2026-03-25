<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    /**
     * Cek stock berdasarkan product_id
     */
    public function show(int $product_id): JsonResponse
    {
        $product = Product::find($product_id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product tidak ditemukan',
                'code'    => 'PRODUCT_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock retrieved successfully',
            'data'    => [
                'product_id' => $product->id,
                'quantity'   => $product->stock,
                'unit'       => $product->unit,
                'updated_at' => $product->updated_at,
            ],
        ]);
    }
}
