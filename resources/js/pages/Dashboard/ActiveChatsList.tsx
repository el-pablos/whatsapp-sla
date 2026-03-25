interface Chat {
  id: string
  customerName: string
  customerPhone: string
  lastMessage: string
  unreadCount: number
  lastMessageAt: string
  isUrgent: boolean
}

interface ActiveChatsListProps {
  chats: Chat[]
  onChatClick?: (chatId: string) => void
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Baru saja'
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`
  return `${Math.floor(diffInMinutes / 1440)} hari lalu`
}

export default function ActiveChatsList({ chats, onChatClick }: ActiveChatsListProps) {
  if (chats.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat Aktif</h2>
        <p className="text-sm text-gray-500 text-center py-8">Tidak ada chat aktif</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Chat Aktif</h2>
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded-full">
          {chats.length}
        </span>
      </div>
      <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              type="button"
              onClick={() => onChatClick?.(chat.id)}
              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {chat.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {chat.customerName}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTimeAgo(chat.lastMessageAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{chat.customerPhone}</p>
                <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {chat.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-500 rounded-full">
                    {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                  </span>
                )}
                {chat.isUrgent && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded">
                    Urgent
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
