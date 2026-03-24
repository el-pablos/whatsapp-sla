import { useState, useCallback, useEffect, useMemo } from 'react'
import { usePage } from '@inertiajs/react'
import {
  type Order,
  type OrderStatus,
  type OrderFilters as FiltersType,
  type PaginationMeta,
} from './types'
import { OrderFilters } from './OrderFilters'
import { OrderTable } from './OrderTable'
import { OrderDetail } from './OrderDetail'
import { ExportButton } from './ExportButton'

interface PageProps {
  orders: {
    data: Array<{
      id: number
      customer_name: string
      customer_phone: string
      status: OrderStatus
      total: number
      notes: string | null
      created_at: string
      updated_at: string
      items: Array<{
        id: number
        product_id: number
        quantity: number
        price: number
        subtotal: number
        product?: {
          id: number
          name: string
        }
      }>
    }>
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Transform backend data to frontend Order type
function transformOrder(rawOrder: PageProps['orders']['data'][0]): Order {
  return {
    id: rawOrder.id,
    order_number: `ORD-${rawOrder.id.toString().padStart(5, '0')}`,
    customer: {
      name: rawOrder.customer_name || 'Unknown',
      phone: rawOrder.customer_phone || '-',
    },
    items: (rawOrder.items || []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product?.name || 'Unknown Product',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    pricing: {
      subtotal: rawOrder.total || 0,
      discount: 0,
      total: rawOrder.total || 0,
      formatted_total: `Rp ${(rawOrder.total || 0).toLocaleString('id-ID')}`,
    },
    status: rawOrder.status,
    notes: rawOrder.notes,
    source: 'whatsapp',
    metadata: null,
    created_at: rawOrder.created_at,
    updated_at: rawOrder.updated_at,
  }
}

export default function OrdersIndex() {
  const { orders: paginatedOrders } = usePage<PageProps>().props

  // Transform raw orders to Order type
  const initialOrders = useMemo(() => {
    return (paginatedOrders?.data || []).map(transformOrder)
  }, [paginatedOrders])

  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [pagination, setPagination] = useState<PaginationMeta | null>(
    paginatedOrders
      ? {
          current_page: paginatedOrders.current_page,
          last_page: paginatedOrders.last_page,
          per_page: paginatedOrders.per_page,
          total: paginatedOrders.total,
        }
      : null
  )

  // Update state when props change
  useEffect(() => {
    if (paginatedOrders?.data) {
      setOrders(paginatedOrders.data.map(transformOrder))
      setPagination({
        current_page: paginatedOrders.current_page,
        last_page: paginatedOrders.last_page,
        per_page: paginatedOrders.per_page,
        total: paginatedOrders.total,
      })
    }
  }, [paginatedOrders])

  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    status: '',
    date_from: '',
    date_to: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  // Filter orders (client-side for mock, replace with API)
  const filteredOrders = orders.filter((order) => {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchesSearch =
        order.order_number.toLowerCase().includes(search) ||
        order.customer.name.toLowerCase().includes(search) ||
        order.customer.phone.includes(search)
      if (!matchesSearch) return false
    }
    if (filters.status && order.status !== filters.status) {
      return false
    }
    if (filters.date_from) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0]
      if (orderDate < filters.date_from) return false
    }
    if (filters.date_to) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0]
      if (orderDate > filters.date_to) return false
    }
    return true
  })

  const handlePageChange = useCallback((page: number) => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setPagination((prev) => (prev ? { ...prev, current_page: page } : null))
      setIsLoading(false)
    }, 500)
  }, [])

  const handleViewDetail = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }, [])

  const handleOpenUpdateModal = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsUpdateModalOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false)
    setSelectedOrder(null)
  }, [])

  const handleCloseUpdateModal = useCallback(() => {
    setIsUpdateModalOpen(false)
    setSelectedOrder(null)
  }, [])

  const handleUpdateStatus = useCallback(async (orderId: number, newStatus: OrderStatus) => {
    setIsUpdating(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        )
      )

      // Update selected order if open
      setSelectedOrder((prev) =>
        prev?.id === orderId ? { ...prev, status: newStatus } : prev
      )
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Stats summary
  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm dark:bg-gray-800 print:hidden">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Manajemen Order
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredOrders.length} order ditemukan
              </p>
            </div>
            <ExportButton orders={filteredOrders} filters={filters} isLoading={isLoading} />
          </div>
        </div>
      </header>

      {/* Quick Stats - Mobile Optimized */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8 print:hidden">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Menunggu</p>
            <p className="mt-1 text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Diproses</p>
            <p className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.processing}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <p className="text-xs font-medium text-green-600 dark:text-green-400">Selesai</p>
            <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="print:hidden">
          <OrderFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Order List */}
        <OrderTable
          orders={filteredOrders}
          pagination={pagination}
          onPageChange={handlePageChange}
          onViewDetail={handleViewDetail}
          onUpdateStatus={handleOpenUpdateModal}
          isLoading={isLoading}
        />

        {/* Print View */}
        <div className="hidden print:block">
          <h2 className="mb-4 text-lg font-semibold">Daftar Order</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">No. Order</th>
                <th className="py-2 text-left">Customer</th>
                <th className="py-2 text-left">Total</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-2">{order.order_number}</td>
                  <td className="py-2">{order.customer.name}</td>
                  <td className="py-2">{order.pricing.formatted_total}</td>
                  <td className="py-2">{order.status}</td>
                  <td className="py-2">
                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Order Detail Modal */}
      <OrderDetail
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdating}
      />

      {/* Status Update Modal (reusing detail modal for update) */}
      <OrderDetail
        order={selectedOrder}
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdating}
      />
    </div>
  )
}
