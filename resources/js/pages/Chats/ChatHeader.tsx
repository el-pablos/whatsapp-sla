import { cn } from '@/lib/utils'
import type { Chat, ChatStatus } from '@/types/chat'

interface ChatHeaderProps {
  chat: Chat
  onBack?: () => void
  onTakeover: () => void
  onResolve: () => void
}

const statusConfig: Record<ChatStatus, { label: string; color: string; bgColor: string }> = {
  bot: {
    label: 'Bot Handling',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  admin: {
    label: 'Admin Handling',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  resolved: {
    label: 'Selesai',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
}

export function ChatHeader({ chat, onBack, onTakeover, onResolve }: ChatHeaderProps) {
  const status = statusConfig[chat.status]

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
          aria-label="Kembali"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300"
        aria-hidden="true"
      >
        {chat.customer.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
          {chat.customer.name}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{chat.customer.phone}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.bgColor, status.color)}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {chat.status === 'bot' && (
          <button
            type="button"
            onClick={onTakeover}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
              'bg-blue-600 text-white hover:bg-blue-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <span className="hidden sm:inline">Ambil Alih</span>
            <span className="sm:hidden">Takeover</span>
          </button>
        )}

        {chat.status === 'admin' && (
          <button
            type="button"
            onClick={onResolve}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
              'bg-green-600 text-white hover:bg-green-700',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            )}
          >
            <span className="hidden sm:inline">Tandai Selesai</span>
            <span className="sm:hidden">Selesai</span>
          </button>
        )}

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Menu lainnya"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
