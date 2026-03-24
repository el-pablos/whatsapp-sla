import { useState, useRef, useEffect } from 'react'
import { type Product } from './types'

interface StockUpdateModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (productId: number, newStock: number) => Promise<void>
  isSubmitting?: boolean
}

export function StockUpdateModal({ product, isOpen, onClose, onSubmit, isSubmitting }: StockUpdateModalProps) {
  const [stock, setStock] = useState(0)
  const [adjustment, setAdjustment] = useState(0)
  const [mode, setMode] = useState<'set' | 'adjust'>('set')
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (product && isOpen) {
      setStock(product.stock)
      setAdjustment(0)
      setMode('set')
      setError(null)
      setTimeout(() => inputRef.current?.select(), 100)
    }
  }, [product, isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose()
    }
  }

  const calculateFinalStock = (): number => {
    if (!product) return 0
    if (mode === 'set') return stock
    return product.stock + adjustment
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    const finalStock = calculateFinalStock()
    if (finalStock < 0) {
      setError('Stok tidak boleh negatif')
      return
    }

    await onSubmit(product.id, finalStock)
  }

  const handleQuickAdjust = (amount: number) => {
    setMode('adjust')
    setAdjustment((prev) => prev + amount)
  }

  if (!isOpen || !product) return null

  const finalStock = calculateFinalStock()

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-update-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 id="stock-update-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Update Stok
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Product Info */}
          <div className="mb-6 flex items-center gap-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-600">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Stok saat ini: <span className="font-medium">{product.stock} {product.unit}</span>
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mb-4 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
            <button
              type="button"
              onClick={() => {
                setMode('set')
                setStock(product.stock)
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'set'
                  ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Set Langsung
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('adjust')
                setAdjustment(0)
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'adjust'
                  ? 'bg-white text-gray-900 shadow dark:bg-gray-600 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Tambah/Kurang
            </button>
          </div>

          {/* Input based on mode */}
          {mode === 'set' ? (
            <div className="mb-4">
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Stok Baru
              </label>
              <div className="relative mt-1">
                <input
                  ref={inputRef}
                  type="number"
                  id="stock"
                  value={stock}
                  onChange={(e) => {
                    setStock(Number(e.target.value) || 0)
                    setError(null)
                  }}
                  min="0"
                  className="block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 sm:text-sm">
                  {product.unit}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="adjustment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Penyesuaian
              </label>
              <div className="relative mt-1">
                <input
                  ref={inputRef}
                  type="number"
                  id="adjustment"
                  value={adjustment}
                  onChange={(e) => {
                    setAdjustment(Number(e.target.value) || 0)
                    setError(null)
                  }}
                  className="block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 sm:text-sm">
                  {product.unit}
                </span>
              </div>

              {/* Quick Adjust Buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[-100, -50, -10, 10, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAdjust(amount)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      amount < 0
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {amount > 0 ? '+' : ''}{amount}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result Preview */}
          <div className={`mb-4 rounded-lg p-3 ${
            finalStock < 0
              ? 'bg-red-50 dark:bg-red-900/20'
              : finalStock === 0
                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                : 'bg-gray-50 dark:bg-gray-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Stok Akhir:</span>
              <span className={`text-lg font-semibold ${
                finalStock < 0
                  ? 'text-red-600 dark:text-red-400'
                  : finalStock === 0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-gray-900 dark:text-white'
              }`}>
                {finalStock} {product.unit}
              </span>
            </div>
            {mode === 'adjust' && adjustment !== 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {product.stock} {adjustment >= 0 ? '+' : ''} {adjustment} = {finalStock}
              </p>
            )}
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || finalStock < 0}
              className="flex-1 inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                'Update Stok'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
