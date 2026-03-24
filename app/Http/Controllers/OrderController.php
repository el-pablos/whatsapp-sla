<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with(['chat', 'items.product'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Orders/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'chat_id' => 'required|exists:chats,id',
            'status' => 'required|in:pending,confirmed,completed,cancelled',
            'total_amount' => 'required|numeric|min:0',
        ]);

        Order::create($validated);

        return redirect()->route('orders.index')
            ->with('success', 'Order berhasil dibuat');
    }

    public function show(Order $order): Response
    {
        return Inertia::render('Orders/Show', [
            'order' => $order->load(['chat', 'items.product']),
        ]);
    }

    public function edit(Order $order): Response
    {
        return Inertia::render('Orders/Edit', [
            'order' => $order,
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,completed,cancelled',
            'total_amount' => 'required|numeric|min:0',
        ]);

        $order->update($validated);

        return redirect()->route('orders.index')
            ->with('success', 'Order berhasil diupdate');
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->route('orders.index')
            ->with('success', 'Order berhasil dihapus');
    }
}
