import { useState, useCallback } from 'react'
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

// Mock data - replace with actual API call
const mockOrders: Order[] = [
  {
    id: 1,
    order_number: 'ORD-20240324-001',
    customer: { name: 'Budi Santoso', phone: '6281234567890' },
    items: [
      { id: 1, product_id: 1, product_name: 'Telur Ayam Negeri', quantity: 5, price: 28000, subtotal: 140000 },
      { id: 2, product_id: 3, product_name: 'Ayam Potong Segar', quantity: 2, price: 38000, subtotal: 76000 },
    ],
    pricing: { subtotal: 216000, discount: 10000, total: 206000, formatted_total: 'Rp 206.000' },
    status: 'pending',
    notes: 'Tolong diantar sebelum jam 12 siang',
    source: 'whatsapp',
    metadata: null,
    created_at: '2024-03-24T08:30:00Z',
    updated_at: '2024-03-24T08:30:00Z',
  },
  {
    id: 2,
    order_number: 'ORD-20240324-002',
    customer: { name: 'Siti Rahayu', phone: '6287654321098' },
    items: [
      { id: 3, product_id: 2, product_name: 'Telur Ayam Kampung', quantity: 3, price: 45000, subtotal: 135000 },
    ],
    pricing: { subtotal: 135000, discount: 0, total: 135000, formatted_total: 'Rp 135.000' },
    status: 'confirmed',
    notes: null,
    source: 'whatsapp',
    metadata: null,
    created_at: '2024-03-24T09:15:00Z',
    updated_at: '2024-03-24T09:20:00Z',
  },
  {
    id: 3,
    order_number: 'ORD-20240323-015',
    customer: { name: 'Ahmad Wijaya', phone: '6289876543210' },
    items: [
      { id: 4, product_id: 1, product_name: 'Telur Ayam Negeri', quantity: 10, price: 28000, subtotal: 280000 },
    ],
    pricing: { subtotal: 280000, discount: 20000, total: 260000, formatted_total: 'Rp 260.000' },
    status: 'processing',
    notes: 'Pelanggan tetap',
    source: 'whatsapp',
    metadata: null,
    created_at: '2024-03-23T14:00:00Z',
    updated_at: '2024-03-24T07:00:00Z',
  },
  {
    id: 4,
    order_number: 'ORD-20240323-012',
    customer: { name: 'Dewi Lestari', phone: '6281122334455' },
    items: [
      { id: 5, product_id: 3, product_name: 'Ayam Potong Segar', quantity: 5, price: 38000, subtotal: 190000 },
      { id: 6, product_id: 4, product_name: 'Daging Ayam Fillet', quantity: 2, price: 55000, subtotal: 110000 },
    ],
    pricing: { subtotal: 300000, discount: 0, total: 300000, formatted_total: 'Rp 300.000' },
    status: 'completed',
    notes: null,
    source: 'whatsapp',
    metadata: null,
    created_at: '2024-03-23T10:00:00Z',
    updated_at: '2024-03-23T16:00:00Z',
  },
  {
    id: 5,
    order_number: 'ORD-20240322-008',
    customer: { name: 'Rudi Hermawan', phone: '6285566778899' },
    items: [
      { id: 7, product_id: 5, product_name: 'Telur Puyuh', quantity: 2, price: 35000, subtotal: 70000 },
    ],
    pricing: { subtotal: 70000, discount: 0, total: 70000, formatted_total: 'Rp 70.000' },
    status: 'cancelled',
    notes: 'Customer membatalkan pesanan',
    source: 'whatsapp',
    metadata: null,
    created_at: '2024-03-22T11:00:00Z',
    updated_at: '2024-03-22T11:30:00Z',
  },
]

const mockPagination: PaginationMeta = {
  current_page: 1,
  last_page: 3,
  per_page: 15,
  total: 42,
}

export default function OrdersIndex() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [pagination, setPagination] = useState<PaginationMeta | null>(mockPagination)
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
