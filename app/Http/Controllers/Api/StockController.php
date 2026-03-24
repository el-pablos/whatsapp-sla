<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    /**
     * Cek stock berdasarkan product_id
     */
    public function show(int $product_id): JsonResponse
    {
        $stock = Stock::where('product_id', $product_id)->first();

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Stock tidak ditemukan',
                'code'    => 'STOCK_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock retrieved successfully',
            'data'    => [
                'product_id' => $stock->product_id,
                'quantity'   => $stock->quantity,
                'updated_at' => $stock->updated_at,
            ],
        ]);
    }
}
