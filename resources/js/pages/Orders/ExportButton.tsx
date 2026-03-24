import { useState } from 'react'
import { type Order, type OrderFilters } from './types'

interface ExportButtonProps {
  orders: Order[]
  filters: OrderFilters
  isLoading?: boolean
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(price: number): number {
  return price
}

function generateCSV(orders: Order[]): string {
  const headers = [
    'No. Order',
    'Tanggal',
    'Nama Customer',
    'No. HP',
    'Items',
    'Subtotal',
    'Diskon',
    'Total',
    'Status',
    'Catatan',
  ]

  const rows = orders.map((order) => [
    order.order_number,
    formatDate(order.created_at),
    order.customer.name,
    order.customer.phone,
    order.items.map((i) => `${i.product_name} (${i.quantity}x)`).join('; '),
    formatPrice(order.pricing.subtotal),
    formatPrice(order.pricing.discount),
    formatPrice(order.pricing.total),
    order.status,
    order.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ExportButton({ orders, filters, isLoading }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csv = generateCSV(orders)
      const timestamp = new Date().toISOString().split('T')[0]
      const statusSuffix = filters.status ? `-${filters.status}` : ''
      downloadFile(csv, `orders${statusSuffix}-${timestamp}.csv`, 'text/csv;charset=utf-8;')
    } finally {
      setIsExporting(false)
      setShowDropdown(false)
    }
  }

  const handleExportJSON = async () => {
    setIsExporting(true)
    try {
      const json = JSON.stringify(orders, null, 2)
      const timestamp = new Date().toISOString().split('T')[0]
      const statusSuffix = filters.status ? `-${filters.status}` : ''
      downloadFile(json, `orders${statusSuffix}-${timestamp}.json`, 'application/json')
    } finally {
      setIsExporting(false)
      setShowDropdown(false)
    }
  }

  const handlePrint = () => {
    window.print()
    setShowDropdown(false)
  }

  if (orders.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isLoading || isExporting}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      >
        {isExporting ? (
          <>
            <svg className="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
            <svg className="ml-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
            aria-hidden="true"
          />
          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Export JSON
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                type="button"
                onClick={handlePrint}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
