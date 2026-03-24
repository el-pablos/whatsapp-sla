import { useState, useMemo, useCallback } from 'react'
import {
  type Product,
  type ProductFilters as FiltersType,
  type ProductFormData,
  type SortConfig,
  type SortField,
} from './types'
import { ProductFilters } from './ProductFilters'
import { ProductTable } from './ProductTable'
import { ProductCardList } from './ProductCard'
import { ProductForm } from './ProductForm'
import { StockUpdateModal } from './StockUpdateModal'

// Mock data - replace with actual API call
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Telur Ayam Negeri',
    type: 'telur',
    description: 'Telur ayam negeri segar, ukuran medium',
    price: 28000,
    stock: 150,
    unit: 'kg',
    image_url: null,
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Telur Ayam Kampung',
    type: 'telur',
    description: 'Telur ayam kampung organik',
    price: 45000,
    stock: 50,
    unit: 'kg',
    image_url: null,
    status: 'active',
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 3,
    name: 'Ayam Potong Segar',
    type: 'ayam',
    description: 'Ayam potong segar siap masak',
    price: 38000,
    stock: 75,
    unit: 'kg',
    image_url: null,
    status: 'active',
    created_at: '2024-01-13T10:00:00Z',
    updated_at: '2024-01-13T10:00:00Z',
  },
  {
    id: 4,
    name: 'Daging Ayam Fillet',
    type: 'ayam',
    description: 'Daging ayam tanpa tulang',
    price: 55000,
    stock: 0,
    unit: 'kg',
    image_url: null,
    status: 'out_of_stock',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
  },
  {
    id: 5,
    name: 'Telur Puyuh',
    type: 'telur',
    description: 'Telur puyuh segar',
    price: 35000,
    stock: 30,
    unit: 'kg',
    image_url: null,
    status: 'inactive',
    created_at: '2024-01-11T10:00:00Z',
    updated_at: '2024-01-11T10:00:00Z',
  },
]

export default function ProductsIndex() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [filters, setFilters] = useState<FiltersType>({ search: '', type: '', status: '' })
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', direction: 'asc' })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      )
    }
    if (filters.type) {
      result = result.filter((p) => p.type === filters.type)
    }
    if (filters.status) {
      result = result.filter((p) => p.status === filters.status)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortConfig.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          comparison = a.price - b.price
          break
        case 'stock':
          comparison = a.stock - b.stock
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    return result
  }, [products, filters, sortConfig])

  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const handleOpenForm = useCallback((product?: Product) => {
    setSelectedProduct(product || null)
    setIsFormOpen(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setSelectedProduct(null)
  }, [])

  const handleFormSubmit = useCallback(async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (selectedProduct) {
        // Update existing product
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? {
                  ...p,
                  ...data,
                  image_url: data.image ? URL.createObjectURL(data.image) : p.image_url,
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        )
      } else {
        // Create new product
        const newProduct: Product = {
          id: Math.max(...products.map((p) => p.id)) + 1,
          ...data,
          image_url: data.image ? URL.createObjectURL(data.image) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProducts((prev) => [newProduct, ...prev])
      }
      handleCloseForm()
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedProduct, products, handleCloseForm])

  const handleOpenStockModal = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsStockModalOpen(true)
  }, [])

  const handleCloseStockModal = useCallback(() => {
    setIsStockModalOpen(false)
    setSelectedProduct(null)
  }, [])

  const handleStockUpdate = useCallback(async (productId: number, newStock: number) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                stock: newStock,
                status: newStock === 0 ? 'out_of_stock' : p.status === 'out_of_stock' ? 'active' : p.status,
                updated_at: new Date().toISOString(),
              }
            : p
        )
      )
      handleCloseStockModal()
    } finally {
      setIsSubmitting(false)
    }
  }, [handleCloseStockModal])

  const handleDeleteClick = useCallback((product: Product) => {
    setProductToDelete(product)
    setIsDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      setIsDeleteConfirmOpen(false)
      setProductToDelete(null)
    } finally {
      setIsSubmitting(false)
    }
  }, [productToDelete])

  const handleCancelDelete = useCallback(() => {
    setIsDeleteConfirmOpen(false)
    setProductToDelete(null)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Manajemen Produk
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filteredProducts.length} produk ditemukan
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenForm()}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tambah Produk
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <ProductFilters filters={filters} onFilterChange={setFilters} />

        {/* Product List - Table for desktop, Cards for mobile */}
        <ProductTable
          products={filteredProducts}
          sortConfig={sortConfig}
          onSort={handleSort}
          onEdit={handleOpenForm}
          onDelete={handleDeleteClick}
          onUpdateStock={handleOpenStockModal}
          isLoading={isLoading}
        />

        <ProductCardList
          products={filteredProducts}
          onEdit={handleOpenForm}
          onDelete={handleDeleteClick}
          onUpdateStock={handleOpenStockModal}
          isLoading={isLoading}
        />
      </main>

      {/* Product Form Modal */}
      <ProductForm
        product={selectedProduct}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Stock Update Modal */}
      <StockUpdateModal
        product={selectedProduct}
        isOpen={isStockModalOpen}
        onClose={handleCloseStockModal}
        onSubmit={handleStockUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h3
              id="delete-dialog-title"
              className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white"
            >
              Hapus Produk
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Apakah Anda yakin ingin menghapus <strong>{productToDelete.name}</strong>? Tindakan
              ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
