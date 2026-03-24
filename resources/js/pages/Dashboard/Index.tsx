import StatCard from './StatCard'
import RecentOrdersTable from './RecentOrdersTable'
import ActiveChatsList from './ActiveChatsList'
import QuickActions from './QuickActions'

// Icons as simple SVG components
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

const CurrencyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

// Demo data - in production, this would come from API/props
const demoStats = {
  totalOrders: 156,
  ordersTrend: { value: 12, isPositive: true },
  activeChats: 23,
  chatsTrend: { value: 5, isPositive: true },
  totalProducts: 48,
  todayRevenue: 15750000,
  revenueTrend: { value: 8, isPositive: true },
}

const demoOrders = [
  { id: 'ORD001', customer: 'Ahmad Rizki', product: 'Kaos Polos XL', amount: 150000, status: 'completed' as const, createdAt: '2026-03-24T10:30:00' },
  { id: 'ORD002', customer: 'Siti Nurhaliza', product: 'Hijab Premium', amount: 250000, status: 'processing' as const, createdAt: '2026-03-24T10:15:00' },
  { id: 'ORD003', customer: 'Budi Santoso', product: 'Celana Jeans', amount: 350000, status: 'pending' as const, createdAt: '2026-03-24T09:45:00' },
  { id: 'ORD004', customer: 'Dewi Lestari', product: 'Dress Casual', amount: 275000, status: 'completed' as const, createdAt: '2026-03-24T09:30:00' },
  { id: 'ORD005', customer: 'Eko Prasetyo', product: 'Sepatu Sneakers', amount: 450000, status: 'processing' as const, createdAt: '2026-03-24T09:00:00' },
]

const demoChats = [
  { id: 'CHAT001', customerName: 'Maria Santos', customerPhone: '+62812345678', lastMessage: 'Kak, barangnya sudah dikirim belum ya?', unreadCount: 3, lastMessageAt: '2026-03-24T11:30:00', isUrgent: true },
  { id: 'CHAT002', customerName: 'John Doe', customerPhone: '+62898765432', lastMessage: 'Terima kasih kak', unreadCount: 0, lastMessageAt: '2026-03-24T11:15:00', isUrgent: false },
  { id: 'CHAT003', customerName: 'Lisa Permata', customerPhone: '+62856789012', lastMessage: 'Ada warna lain ga kak?', unreadCount: 2, lastMessageAt: '2026-03-24T10:45:00', isUrgent: false },
  { id: 'CHAT004', customerName: 'Rudi Hartono', customerPhone: '+62878901234', lastMessage: 'Mau order dong kak', unreadCount: 1, lastMessageAt: '2026-03-24T10:30:00', isUrgent: false },
]

export default function Dashboard() {
  const quickActions = [
    { id: 'new-order', label: 'Order Baru', icon: <PlusIcon />, onClick: () => console.log('New order'), variant: 'primary' as const },
    { id: 'broadcast', label: 'Broadcast', icon: <BroadcastIcon />, onClick: () => console.log('Broadcast'), variant: 'success' as const },
    { id: 'report', label: 'Laporan', icon: <DocumentIcon />, onClick: () => console.log('Report'), variant: 'secondary' as const },
    { id: 'analytics', label: 'Analitik', icon: <ChartIcon />, onClick: () => console.log('Analytics'), variant: 'secondary' as const },
  ]

  const handleChatClick = (chatId: string) => {
    console.log('Open chat:', chatId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali! Ini ringkasan toko kamu hari ini.</p>
        </div>

        {/* Stats Grid - 2x2 mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <StatCard
            title="Total Pesanan"
            value={demoStats.totalOrders}
            icon={<ShoppingBagIcon />}
            trend={demoStats.ordersTrend}
            color="blue"
          />
          <StatCard
            title="Chat Aktif"
            value={demoStats.activeChats}
            icon={<ChatBubbleIcon />}
            trend={demoStats.chatsTrend}
            color="green"
          />
          <StatCard
            title="Total Produk"
            value={demoStats.totalProducts}
            icon={<CubeIcon />}
            color="yellow"
          />
          <StatCard
            title="Pendapatan Hari Ini"
            value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(demoStats.todayRevenue)}
            icon={<CurrencyIcon />}
            trend={demoStats.revenueTrend}
            color="green"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions actions={quickActions} />
        </div>

        {/* Main Content Grid - Stack mobile, 2 cols desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Orders - Takes 2 cols on desktop */}
          <div className="lg:col-span-2">
            <RecentOrdersTable orders={demoOrders} />
          </div>

          {/* Active Chats - Takes 1 col on desktop */}
          <div>
            <ActiveChatsList chats={demoChats} onChatClick={handleChatClick} />
          </div>
        </div>
      </div>
    </div>
  )
}
