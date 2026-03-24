import { type Order, type PaginationMeta } from './types'
import { StatusBadge } from './StatusBadge'

interface OrderTableProps {
  orders: Order[]
  pagination: PaginationMeta | null
  onPageChange: (page: number) => void
  onViewDetail: (order: Order) => void
  onUpdateStatus: (order: Order) => void
  isLoading?: boolean
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPhone(phone: string): string {
  if (phone.startsWith('62')) {
    return '+' + phone
  }
  return phone
}

function getWhatsAppLink(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}`
}

// Mobile Card Component
function OrderCard({
  order,
  onViewDetail,
  onUpdateStatus,
}: {
  order: Order
  onViewDetail: (order: Order) => void
  onUpdateStatus: (order: Order) => void
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-3">
      {/* Header: Order Number & Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {order.order_number}
        </span>
        <StatusBadge status={order.status} />
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {order.customer.name}
          </p>
          <a
            href={getWhatsAppLink(order.customer.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 inline-flex items-center gap-1"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {formatPhone(order.customer.phone)}
          </a>
        </div>
        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
          {order.pricing.formatted_total}
        </span>
      </div>

      {/* Items Summary */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {order.items.length} item - {formatDate(order.created_at)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onViewDetail(order)}
          className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Detail
        </button>
        <button
          type="button"
          onClick={() => onUpdateStatus(order)}
          className="flex-1 inline-flex items-center justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Update
        </button>
      </div>
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Empty State
function EmptyState() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
        Tidak ada order
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Belum ada order yang sesuai dengan filter.
      </p>
    </div>
  )
}

// Pagination Component
function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
}) {
  const { current_page, last_page, total } = pagination

  if (last_page <= 1) return null

  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, current_page - Math.floor(maxVisible / 2))
  const end = Math.min(last_page, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Total: <span className="font-medium text-gray-900 dark:text-white">{total}</span> order
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 rounded-md text-sm font-medium ${
              page === current_page
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function OrderTable({
  orders,
  pagination,
  onPageChange,
  onViewDetail,
  onUpdateStatus,
  isLoading,
}: OrderTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (orders.length === 0) {
    return <EmptyState />
  }

  return (
    <>
      {/* Mobile View: Card List */}
      <div className="md:hidden">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetail={onViewDetail}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  No. Order
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tanggal
                </th>
                <th scope="col" className="relative px-4 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.order_number}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.items.length} item
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {order.customer.name}
                    </p>
                    <a
                      href={getWhatsAppLink(order.customer.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 inline-flex items-center gap-1"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {formatPhone(order.customer.phone)}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {order.pricing.formatted_total}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewDetail(order)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(order)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                      >
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </>
  )
}
