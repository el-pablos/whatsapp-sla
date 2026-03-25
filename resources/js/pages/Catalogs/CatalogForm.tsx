import { useState, useCallback, useRef } from 'react'
import ProductSelector from './ProductSelector'
import type { Catalog, Product } from './Index'

interface CatalogFormProps {
  catalog: Catalog | null
  availableProducts: Product[]
  onSave: (data: Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

export default function CatalogForm({ catalog, availableProducts, onSave, onClose }: CatalogFormProps) {
  const [name, setName] = useState(catalog?.name || '')
  const [description, setDescription] = useState(catalog?.description || '')
  const [coverImage, setCoverImage] = useState<string | undefined>(catalog?.coverImage)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(catalog?.products || [])
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = catalog !== null

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Nama katalog wajib diisi'
    } else if (name.length > 100) {
      newErrors.name = 'Nama maksimal 100 karakter'
    }

    if (description.length > 500) {
      newErrors.description = 'Deskripsi maksimal 500 karakter'
    }

    if (selectedProducts.length === 0) {
      newErrors.products = 'Pilih minimal 1 produk'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, description, selectedProducts])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSave({
      name: name.trim(),
      description: description.trim(),
      coverImage,
      products: selectedProducts,
    })
  }, [name, description, coverImage, selectedProducts, validate, onSave])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'File harus berupa gambar' }))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Ukuran file maksimal 5MB' }))
      return
    }

    // Read and set preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setCoverImage(event.target?.result as string)
      setErrors(prev => {
        const { image, ...rest } = prev
        return rest
      })
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveImage = useCallback(() => {
    setCoverImage(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleProductsChange = useCallback((products: Product[]) => {
    setSelectedProducts(products)
    if (products.length > 0) {
      setErrors(prev => {
        const { products: _, ...rest } = prev
        return rest
      })
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Katalog' : 'Buat Katalog Baru'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>
                {coverImage ? (
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black/80"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Upload gambar cover</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="catalog-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Katalog <span className="text-red-500">*</span>
                </label>
                <input
                  id="catalog-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Promo Telur Minggu Ini"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="catalog-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  id="catalog-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat katalog..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">{description.length}/500</span>
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Produk <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    className="text-sm text-green-600 font-medium hover:text-green-700"
                  >
                    {selectedProducts.length > 0 ? 'Ubah' : 'Pilih Produk'}
                  </button>
                </div>

                {selectedProducts.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    className={`w-full py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors ${
                      errors.products ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-sm">Pilih produk untuk katalog</span>
                  </button>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {selectedProducts.map(product => (
                      <div key={product.id} className="flex items-center gap-3 p-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            Rp {product.price.toLocaleString('id-ID')}/{product.unit}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProducts(prev => prev.filter(p => p.id !== product.id))}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.products && (
                  <p className="mt-1 text-sm text-red-600">{errors.products}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
              >
                {isEditing ? 'Simpan' : 'Buat Katalog'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <ProductSelector
          availableProducts={availableProducts}
          selectedProducts={selectedProducts}
          onConfirm={handleProductsChange}
          onClose={() => setShowProductSelector(false)}
        />
      )}
    </div>
  )
}
