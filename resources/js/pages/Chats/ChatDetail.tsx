import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Chat, Message } from '@/types/chat'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { MessageBubble } from './MessageBubble'

interface ChatDetailProps {
  chat: Chat | null
  messages: Message[]
  isLoading?: boolean
  onBack?: () => void
  onSendMessage: (content: string) => void
  onTakeover: () => void
  onResolve: () => void
}

export function ChatDetail({
  chat,
  messages,
  isLoading,
  onBack,
  onSendMessage,
  onTakeover,
  onResolve,
}: ChatDetailProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-8 text-center dark:bg-gray-900">
        <div className="mb-4 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-gray-100">Pilih Chat</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Pilih chat dari daftar untuk melihat percakapan</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      <ChatHeader chat={chat} onBack={onBack} onTakeover={onTakeover} onResolve={onResolve} />

      <div
        className={cn('flex-1 overflow-y-auto px-3 py-4 sm:px-4', 'bg-[url(/images/chat-bg.png)] bg-repeat')}
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                />
              </svg>
              <span className="text-sm">Memuat pesan...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada pesan dalam chat ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onSend={onSendMessage}
        disabled={chat.status === 'resolved'}
        placeholder={chat.status === 'resolved' ? 'Chat sudah selesai' : 'Ketik pesan...'}
      />
    </div>
  )
}
