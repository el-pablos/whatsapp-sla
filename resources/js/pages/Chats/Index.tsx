import { useState, useCallback } from 'react'
import { Head } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { useChats, useChatDetail } from '@/hooks/useChats'
import type { Chat, ChatStatus } from '@/types/chat'
import { ChatList } from './ChatList'
import { ChatDetail } from './ChatDetail'

export default function ChatsIndex() {
  const [statusFilter, setStatusFilter] = useState<ChatStatus | 'all'>('all')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const { chats, isLoading: isLoadingChats } = useChats({
    status: statusFilter === 'all' ? undefined : statusFilter,
    pollInterval: 5000,
  })

  const {
    chat: chatDetail,
    messages,
    isLoading: isLoadingMessages,
    sendMessage,
    takeover,
    resolve,
  } = useChatDetail(selectedChat?.id ?? null, { pollInterval: 3000 })

  const handleSelectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat)
    setShowDetail(true)
  }, [])

  const handleBack = useCallback(() => {
    setShowDetail(false)
  }, [])

  const handleSendMessage = useCallback(
    async (content: string) => {
      await sendMessage(content)
    },
    [sendMessage]
  )

  const handleTakeover = useCallback(async () => {
    await takeover()
  }, [takeover])

  const handleResolve = useCallback(async () => {
    await resolve()
    setShowDetail(false)
    setSelectedChat(null)
  }, [resolve])

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
            isLoading={isLoadingChats}
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
              chat={chatDetail ?? selectedChat}
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
