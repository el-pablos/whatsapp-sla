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
        $products = Product::where('status', 'active')
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
        // fix: gunakan status field bukan is_active - 2026-03-24
        $products = Product::where('status', 'active')
            ->where('type', $type)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data'    => $products,
        ]);
    }

    /**
     * Store product baru
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'   => 'required|string|max:255',
            'type'   => 'required|in:' . implode(',', Product::getTypes()),
            'size'   => 'nullable|in:' . implode(',', Product::getSizes()),
            'unit'   => 'required|in:' . implode(',', Product::getUnits()),
            'price'  => 'required|numeric|min:0',
            'stock'  => 'nullable|integer|min:0',
            'image'  => 'nullable|string',
            'status' => 'nullable|in:' . implode(',', Product::getStatuses()),
        ]);

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product berhasil dibuat',
            'data'    => $product,
        ], 201);
    }

    /**
     * Update product
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product tidak ditemukan',
                'code'    => 'PRODUCT_NOT_FOUND',
            ], 404);
        }

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'type'   => 'sometimes|in:' . implode(',', Product::getTypes()),
            'size'   => 'nullable|in:' . implode(',', Product::getSizes()),
            'unit'   => 'sometimes|in:' . implode(',', Product::getUnits()),
            'price'  => 'sometimes|numeric|min:0',
            'stock'  => 'nullable|integer|min:0',
            'image'  => 'nullable|string',
            'status' => 'nullable|in:' . implode(',', Product::getStatuses()),
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product berhasil diupdate',
            'data'    => $product->fresh(),
        ]);
    }

    /**
     * Delete product
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product tidak ditemukan',
                'code'    => 'PRODUCT_NOT_FOUND',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product berhasil dihapus',
        ]);
    }

    /**
     * Update stock product
     */
    public function updateStock(Request $request, int $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product tidak ditemukan',
                'code'    => 'PRODUCT_NOT_FOUND',
            ], 404);
        }

        $validated = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $product->update(['stock' => $validated['stock']]);

        return response()->json([
            'success' => true,
            'message' => 'Stock berhasil diupdate',
            'data'    => $product->fresh(),
        ]);
    }
}
