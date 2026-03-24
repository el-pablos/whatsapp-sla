<?php

namespace App\Http\Controllers;

use App\Models\Catalog;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(): Response
    {
        $catalogs = Catalog::with('products')
            ->withCount('products')
            ->latest()
            ->paginate(15);

        $products = Product::active()->get();

        return Inertia::render('Catalogs/Index', [
            'catalogs' => $catalogs,
            'products' => $products,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Catalogs/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|string',
        ]);

        Catalog::create($validated);

        return redirect()->route('catalogs.index')
            ->with('success', 'Katalog berhasil dibuat');
    }

    public function show(Catalog $catalog): Response
    {
        return Inertia::render('Catalogs/Show', [
            'catalog' => $catalog->load('products'),
        ]);
    }

    public function edit(Catalog $catalog): Response
    {
        return Inertia::render('Catalogs/Edit', [
            'catalog' => $catalog,
        ]);
    }

    public function update(Request $request, Catalog $catalog)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|string',
        ]);

        $catalog->update($validated);

        return redirect()->route('catalogs.index')
            ->with('success', 'Katalog berhasil diupdate');
    }

    public function destroy(Catalog $catalog)
    {
        $catalog->delete();

        return redirect()->route('catalogs.index')
            ->with('success', 'Katalog berhasil dihapus');
    }
}
