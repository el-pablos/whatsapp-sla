export type ProductType = 'telur' | 'ayam'
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

export interface Product {
  id: number
  name: string
  type: ProductType
  description: string
  price: number
  stock: number
  unit: string
  image_url: string | null
  status: ProductStatus
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  search: string
  type: ProductType | ''
  status: ProductStatus | ''
}

export interface ProductFormData {
  name: string
  type: ProductType
  description: string
  price: number
  stock: number
  unit: string
  image: File | null
  status: ProductStatus
}

export type SortField = 'name' | 'price' | 'stock' | 'created_at'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  direction: SortDirection
}
