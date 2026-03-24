<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Catalog;
use Illuminate\Http\JsonResponse;

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
}
