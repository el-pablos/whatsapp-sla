<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /**
     * List catalogs aktif
     */
    public function index(): JsonResponse
    {
        $catalogs = Catalog::where('is_active', true)
            ->with('products')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Catalogs retrieved successfully',
            'data'    => $catalogs,
        ]);
    }

    /**
     * Show catalog detail dengan products
     */
    public function show(int $id): JsonResponse
    {
        $catalog = Catalog::with('products')->find($id);

        if (!$catalog) {
            return response()->json([
                'success' => false,
                'message' => 'Catalog not found',
                'code'    => 'CATALOG_NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Catalog retrieved successfully',
            'data'    => $catalog,
        ]);
    }

    /**
     * Create new catalog
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|string|max:255',
            'status'      => 'nullable|string|in:active,inactive',
        ]);

        $catalog = Catalog::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image'       => $validated['image'] ?? null,
            'status'      => $validated['status'] ?? Catalog::STATUS_ACTIVE,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Catalog created successfully',
            'data'    => $catalog,
        ], 201);
    }
}
