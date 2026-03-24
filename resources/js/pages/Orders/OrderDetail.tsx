import { useState } from 'react'
import { type Order, type OrderStatus } from './types'
import { StatusBadge, getStatusOptions } from './StatusBadge'

interface OrderDetailProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (orderId: number, status: OrderStatus) => void
  isUpdating?: boolean
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getWhatsAppLink(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}`
}

export function OrderDetail({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating,
}: OrderDetailProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const [showConfirm, setShowConfirm] = useState(false)
  const statusOptions = getStatusOptions()

  if (!isOpen || !order) return null

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as OrderStatus | ''
    setNewStatus(status)
    if (status) {
      setShowConfirm(true)
    }
  }

  const handleConfirmUpdate = () => {
    if (newStatus) {
      onUpdateStatus(order.id, newStatus)
      setShowConfirm(false)
      setNewStatus('')
    }
  }

  const handleCancelUpdate = () => {
    setShowConfirm(false)
    setNewStatus('')
  }

  const handleClose = () => {
    setShowConfirm(false)
    setNewStatus('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all dark:bg-gray-800 sm:my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div>
              <h2
                id="order-detail-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {order.order_number}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(order.created_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
              aria-label="Tutup"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
            {/* Customer Info */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Informasi Customer
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.customer.name}
                </p>
                <a
                  href={getWhatsAppLink(order.customer.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 inline-flex items-center gap-1 mt-1"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat via WhatsApp
                </a>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Status Order
              </h3>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} size="md" />
                <select
                  value={newStatus}
                  onChange={handleStatusChange}
                  disabled={isUpdating}
                  className="flex-1 rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                >
                  <option value="">Ubah status...</option>
                  {statusOptions
                    .filter((opt) => opt.value !== order.status)
                    .map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && newStatus && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  Yakin ingin mengubah status menjadi{' '}
                  <span className="font-semibold">
                    {statusOptions.find((opt) => opt.value === newStatus)?.label}
                  </span>
                  ?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmUpdate}
                    disabled={isUpdating}
                    className="flex-1 inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Memproses...' : 'Ya, Ubah'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelUpdate}
                    disabled={isUpdating}
                    className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Item Pesanan
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {order.items.map((item, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.product_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatPrice(order.pricing.subtotal)}
                  </span>
                </div>
                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Diskon</span>
                    <span className="text-red-600 dark:text-red-400">
                      -{formatPrice(order.pricing.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {order.pricing.formatted_total}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Catatan
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
