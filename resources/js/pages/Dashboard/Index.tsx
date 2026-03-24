import { usePage } from '@inertiajs/react'
import StatCard from './StatCard'
import RecentOrdersTable from './RecentOrdersTable'
import ActiveChatsList from './ActiveChatsList'
import QuickActions from './QuickActions'

// Icons
const ShoppingBagIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

const ChatBubbleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const CubeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const BroadcastIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

interface Stats {
  orders: { today: number; week: number; month: number }
  pending_orders: number
  active_chats: number
  total_products: number
  low_stock_products: number
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  total: number
  status: string
  created_at: string
}

interface Chat {
  id: number
  customer_name: string
  customer_phone: string
  last_message: string
  status: string
  last_message_at: string
}

interface PageProps {
  stats: Stats
  recentOrders: Order[]
  activeChats: Chat[]
}

export default function Dashboard() {
  const { stats, recentOrders, activeChats } = usePage<PageProps>().props

  // Transform data untuk komponen
  const orders = (recentOrders || []).map(o => ({
    id: o.order_number,
    customer: o.customer_name || 'Customer',
    product: '-',
    amount: o.total || 0,
    status: o.status as 'pending' | 'processing' | 'completed',
    createdAt: o.created_at,
  }))

  const chats = (activeChats || []).map(c => ({
    id: String(c.id),
    customerName: c.customer_name || 'Customer',
    customerPhone: c.customer_phone || '-',
    lastMessage: c.last_message || '-',
    unreadCount: 0,
    lastMessageAt: c.last_message_at || new Date().toISOString(),
    isUrgent: c.status === 'bot',
  }))

  const quickActions = [
    { id: 'new-order', label: 'Order Baru', icon: <PlusIcon />, onClick: () => window.location.href = '/orders', variant: 'primary' as const },
    { id: 'broadcast', label: 'Broadcast', icon: <BroadcastIcon />, onClick: () => alert('Fitur broadcast segera hadir'), variant: 'success' as const },
    { id: 'report', label: 'Laporan', icon: <DocumentIcon />, onClick: () => alert('Fitur laporan segera hadir'), variant: 'secondary' as const },
    { id: 'analytics', label: 'Analitik', icon: <ChartIcon />, onClick: () => alert('Fitur analitik segera hadir'), variant: 'secondary' as const },
  ]

  const handleChatClick = (chatId: string) => {
    window.location.href = `/chats/${chatId}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Data realtime dari database - WhatsApp SLA Ayam Petelur</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <StatCard
            title="Pesanan Hari Ini"
            value={stats?.orders?.today || 0}
            icon={<ShoppingBagIcon />}
            color="blue"
          />
          <StatCard
            title="Chat Aktif"
            value={stats?.active_chats || 0}
            icon={<ChatBubbleIcon />}
            color="green"
          />
          <StatCard
            title="Total Produk"
            value={stats?.total_products || 0}
            icon={<CubeIcon />}
            color="yellow"
          />
          <StatCard
            title="Stok Menipis"
            value={stats?.low_stock_products || 0}
            icon={<WarningIcon />}
            color="red"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions actions={quickActions} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            {orders.length > 0 ? (
              <RecentOrdersTable orders={orders} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <ShoppingBagIcon />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Belum Ada Pesanan</h3>
                <p className="mt-2 text-sm text-gray-500">Pesanan dari WhatsApp akan muncul di sini.</p>
              </div>
            )}
          </div>

          {/* Active Chats */}
          <div>
            {chats.length > 0 ? (
              <ActiveChatsList chats={chats} onChatClick={handleChatClick} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <ChatBubbleIcon />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Belum Ada Chat</h3>
                <p className="mt-2 text-sm text-gray-500">Chat dari WhatsApp akan muncul di sini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
