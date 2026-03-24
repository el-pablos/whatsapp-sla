export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

export interface OrderCustomer {
  phone: string
  name: string
}

export interface OrderPricing {
  subtotal: number
  discount: number
  total: number
  formatted_total: string
}

export interface Order {
  id: number
  order_number: string
  customer: OrderCustomer
  items: OrderItem[]
  pricing: OrderPricing
  status: OrderStatus
  notes: string | null
  source: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface OrderFilters {
  search: string
  status: OrderStatus | ''
  date_from: string
  date_to: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface OrdersResponse {
  data: Order[]
  meta: PaginationMeta
}
