<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display dashboard overview with stats.
     */
    public function index(): Response
    {
        return Inertia::render('Dashboard/Index', [
            'stats' => $this->getDashboardStats(),
            'recentOrders' => $this->getRecentOrdersData(),
            'activeChats' => $this->getActiveChatsData(),
        ]);
    }

    /**
     * Get 10 most recent orders.
     */
    public function recentOrders(): JsonResponse
    {
        return response()->json([
            'orders' => $this->getRecentOrdersData(),
        ]);
    }

    /**
     * Get chats that need attention.
     */
    public function activeChats(): JsonResponse
    {
        return response()->json([
            'chats' => $this->getActiveChatsData(),
        ]);
    }

    /**
     * JSON endpoint for realtime stats update.
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->getDashboardStats());
    }

    /**
     * Get dashboard statistics.
     */
    private function getDashboardStats(): array
    {
        $today = now()->startOfDay();
        $weekStart = now()->startOfWeek();
        $monthStart = now()->startOfMonth();

        return [
            'orders' => [
                'today' => Order::where('created_at', '>=', $today)->count(),
                'week' => Order::where('created_at', '>=', $weekStart)->count(),
                'month' => Order::where('created_at', '>=', $monthStart)->count(),
            ],
            'pending_orders' => Order::where('status', 'pending')->count(),
            'active_chats' => Chat::where('status', 'active')
                ->orWhere('status', 'waiting')
                ->count(),
            'total_products' => Product::count(),
            'low_stock_products' => Product::where('stock', '<=', 10)
                ->where('stock', '>', 0)
                ->count(),
        ];
    }

    /**
     * Get recent orders data.
     */
    private function getRecentOrdersData(): array
    {
        return Order::with(['customer:id,name,phone'])
            ->select(['id', 'order_number', 'customer_id', 'total', 'status', 'created_at'])
            ->latest()
            ->take(10)
            ->get()
            ->toArray();
    }

    /**
     * Get active chats that need attention.
     */
    private function getActiveChatsData(): array
    {
        return Chat::with(['customer:id,name,phone'])
            ->select(['id', 'customer_id', 'last_message', 'status', 'last_message_at'])
            ->whereIn('status', ['active', 'waiting'])
            ->orderByDesc('last_message_at')
            ->take(10)
            ->get()
            ->toArray();
    }
}
