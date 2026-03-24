import { useState, useCallback, useEffect } from 'react'
import { Head, usePage } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import type { Chat, ChatStatus, Message } from '@/types/chat'
import { ChatList } from './ChatList'
import { ChatDetail } from './ChatDetail'

interface PageProps {
  chats: {
    data: Chat[]
  }
  filters: {
    status: string
    search: string
  }
}

export default function ChatsIndex() {
  const { chats: initialChats, filters } = usePage<PageProps>().props

  const [statusFilter, setStatusFilter] = useState<ChatStatus | 'all'>(
    (filters?.status as ChatStatus | 'all') || 'all'
  )
  const [chats, setChats] = useState<Chat[]>(initialChats?.data || [])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Update chats when initial props change
  useEffect(() => {
    if (initialChats?.data) {
      setChats(initialChats.data)
    }
  }, [initialChats])

  const handleSelectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat)
    setShowDetail(true)
    // Load messages for this chat
    setIsLoadingMessages(true)
    // Simulated - in production, fetch from API with auth
    setMessages(chat.messages || [])
    setIsLoadingMessages(false)
  }, [])

  const handleBack = useCallback(() => {
    setShowDetail(false)
  }, [])

  const handleSendMessage = useCallback(
    async (content: string) => {
      // In production, this would call the API
      console.log('Sending message:', content)
    },
    []
  )

  const handleTakeover = useCallback(async () => {
    // In production, this would call the API
    console.log('Taking over chat')
  }, [])

  const handleResolve = useCallback(async () => {
    // In production, this would call the API
    console.log('Resolving chat')
    setShowDetail(false)
    setSelectedChat(null)
  }, [])

  return (
    <>
      <Head title="Chat Monitor" />

      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
        {/* Chat List - Hidden on mobile when detail is shown */}
        <div
          className={cn(
            'w-full flex-shrink-0 md:w-80 lg:w-96',
            showDetail ? 'hidden md:block' : 'block'
          )}
        >
          <ChatList
            chats={chats}
            selectedChatId={selectedChat?.id}
            onSelectChat={handleSelectChat}
            isLoading={false}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        {/* Chat Detail - Full screen on mobile when shown */}
        <div
          className={cn(
            'flex-1',
            !showDetail ? 'hidden md:flex' : 'flex'
          )}
        >
          <div className="w-full">
            <ChatDetail
              chat={selectedChat}
              messages={messages}
              isLoading={isLoadingMessages}
              onBack={handleBack}
              onSendMessage={handleSendMessage}
              onTakeover={handleTakeover}
              onResolve={handleResolve}
            />
          </div>
        </div>
      </div>
    </>
  )
}
