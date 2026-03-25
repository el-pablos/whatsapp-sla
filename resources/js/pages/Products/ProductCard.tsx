import { type Product } from './types'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onUpdateStock: (product: Product) => void
}

function StatusBadge({ status }: { status: Product['status'] }) {
  const config = {
    active: { label: 'Aktif', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    inactive: { label: 'Nonaktif', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    out_of_stock: { label: 'Stok Habis', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  }[status]

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function TypeBadge({ type }: { type: Product['type'] }) {
  const config = {
    telur: { label: 'Telur', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    ayam: { label: 'Ayam', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  }[type]

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function ProductCard({ product, onEdit, onDelete, onUpdateStock }: ProductCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
      {/* Image Header */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <TypeBadge type={product.type} />
          <StatusBadge status={product.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price & Stock */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">per {product.unit}</p>
          </div>
          <button
            type="button"
            onClick={() => onUpdateStock(product)}
            className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            {product.stock} {product.unit}
          </button>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
            aria-label={`Hapus ${product.name}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProductCardListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onUpdateStock: (product: Product) => void
  isLoading?: boolean
}

export function ProductCardList({ products, onEdit, onDelete, onUpdateStock, isLoading }: ProductCardListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
            <div className="aspect-video animate-pulse bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="flex justify-between">
                <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-800">
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">Tidak ada produk</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Belum ada produk yang sesuai dengan filter.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStock={onUpdateStock}
        />
      ))}
    </div>
  )
}
