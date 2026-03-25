import { useState, useMemo, useCallback } from 'react'
import type { Product } from './Index'

interface ProductSelectorProps {
  availableProducts: Product[]
  selectedProducts: Product[]
  onConfirm: (products: Product[]) => void
  onClose: () => void
}

export default function ProductSelector({
  availableProducts,
  selectedProducts,
  onConfirm,
  onClose
}: ProductSelectorProps) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(selectedProducts.map(p => p.id))
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'telur' | 'ayam'>('all')

  const filteredProducts = useMemo(() => {
    return availableProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [availableProducts, searchQuery, categoryFilter])

  const handleToggle = useCallback((productId: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelected(new Set(filteredProducts.map(p => p.id)))
  }, [filteredProducts])

  const handleDeselectAll = useCallback(() => {
    setSelected(new Set())
  }, [])

  const handleConfirm = useCallback(() => {
    const selectedProductsList = availableProducts.filter(p => selected.has(p.id))
    onConfirm(selectedProductsList)
    onClose()
  }, [availableProducts, selected, onConfirm, onClose])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Pilih Produk</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-2">
              {(['all', 'telur', 'ayam'] as const).map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'Semua' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Selection actions */}
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-gray-500">
                {selected.size} produk dipilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-green-600 font-medium hover:text-green-700"
                >
                  Pilih Semua
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-gray-600 font-medium hover:text-gray-700"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="mx-auto w-12 h-12 text-gray-300 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>Produk tidak ditemukan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredProducts.map(product => {
                  const isSelected = selected.has(product.id)
                  const isOutOfStock = product.stock === 0

                  return (
                    <button
                      key={product.id}
                      onClick={() => !isOutOfStock && handleToggle(product.id)}
                      disabled={isOutOfStock}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                        isOutOfStock
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Image */}
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(product.price)}/{product.unit}
                        </p>
                      </div>

                      {/* Stock badge */}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-700'
                          : product.stock < 10
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Pilih ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
