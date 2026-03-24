<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * List semua products aktif
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data'    => $products,
        ]);
    }

    /**
     * Detail satu product
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product tidak ditemukan',
                'code'    => 'PRODUCT_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product retrieved successfully',
            'data'    => $product,
        ]);
    }

    /**
     * Filter products by type
     */
    public function byType(string $type): JsonResponse
    {
        $products = Product::where('is_active', true)
            ->where('type', $type)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data'    => $products,
        ]);
    }
}
