import { useState, useCallback, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import CatalogCard from './CatalogCard'
import CatalogForm from './CatalogForm'
import PreviewModal from './PreviewModal'

export interface Product {
  id: number
  name: string
  price: number
  unit: string
  stock: number
  category: 'telur' | 'ayam'
  image?: string
}

export interface Catalog {
  id: number
  name: string
  description: string
  coverImage?: string
  products: Product[]
  products_count?: number
  createdAt: string
  updatedAt: string
  status: string
}

interface BackendProduct {
  id: number
  name: string
  price: number
  unit: string
  stock: number
  type: 'telur' | 'ayam'
  image?: string
  status: string
}

interface BackendCatalog {
  id: number
  name: string
  description: string
  image?: string
  products: BackendProduct[]
  products_count?: number
  created_at: string
  updated_at: string
  status: string
}

interface PageProps {
  catalogs: {
    data: BackendCatalog[]
  }
  products: BackendProduct[]
}

// Transform backend catalog to frontend Catalog type
function transformCatalog(raw: BackendCatalog): Catalog {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
    coverImage: raw.image,
    products: (raw.products || []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      category: p.type,
      image: p.image,
    })),
    products_count: raw.products_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    status: raw.status,
  }
}

// Transform backend product to frontend Product type
function transformProduct(raw: BackendProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    unit: raw.unit,
    stock: raw.stock,
    category: raw.type,
    image: raw.image,
  }
}

export default function CatalogsPage() {
  const { catalogs: paginatedCatalogs, products: rawProducts } = usePage<PageProps>().props
  const initialCatalogs = (paginatedCatalogs?.data || []).map(transformCatalog)
  const availableProducts = (rawProducts || []).map(transformProduct)

  const [catalogs, setCatalogs] = useState<Catalog[]>(initialCatalogs)

  // Update catalogs when props change
  useEffect(() => {
    if (paginatedCatalogs?.data) {
      setCatalogs(paginatedCatalogs.data.map(transformCatalog))
    }
  }, [paginatedCatalogs])

  const [showForm, setShowForm] = useState(false)
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null)
  const [previewCatalog, setPreviewCatalog] = useState<Catalog | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCatalogs = catalogs.filter(catalog =>
    catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (catalog.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = useCallback(() => {
    setEditingCatalog(null)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((catalog: Catalog) => {
    setEditingCatalog(catalog)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback((catalogId: number) => {
    if (window.confirm('Yakin hapus catalog ini?')) {
      setCatalogs(prev => prev.filter(c => c.id !== catalogId))
      // TODO: API call to delete catalog
    }
  }, [])

  const handleSave = useCallback((catalogData: Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCatalog) {
      // Update existing
      setCatalogs(prev => prev.map(c =>
        c.id === editingCatalog.id
          ? { ...c, ...catalogData, updatedAt: new Date().toISOString() }
          : c
      ))
    } else {
      // Create new
      const newCatalog: Catalog = {
        ...catalogData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setCatalogs(prev => [...prev, newCatalog])
    }
    setShowForm(false)
    setEditingCatalog(null)
  }, [editingCatalog])

  const handlePreview = useCallback((catalog: Catalog) => {
    setPreviewCatalog(catalog)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Katalog</h1>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Buat Katalog</span>
              <span className="sm:hidden">Buat</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
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
              placeholder="Cari katalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {filteredCatalogs.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Katalog tidak ditemukan' : 'Belum ada katalog'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreate}
                className="text-green-600 font-medium hover:text-green-700"
              >
                Buat katalog pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCatalogs.map(catalog => (
              <CatalogCard
                key={catalog.id}
                catalog={catalog}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <CatalogForm
          catalog={editingCatalog}
          availableProducts={availableProducts}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingCatalog(null)
          }}
        />
      )}

      {/* Preview Modal */}
      {previewCatalog && (
        <PreviewModal
          catalog={previewCatalog}
          onClose={() => setPreviewCatalog(null)}
        />
      )}
    </div>
  )
}
