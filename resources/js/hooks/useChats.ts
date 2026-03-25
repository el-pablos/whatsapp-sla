import { useState, useEffect, useCallback, useRef } from 'react'
import type { Chat, ChatListResponse, ChatDetailResponse, Message } from '@/types/chat'

interface UseChatsOptions {
  pollInterval?: number
  status?: string
}

export function useChats(options: UseChatsOptions = {}) {
  const { pollInterval = 5000, status } = options
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchChats = useCallback(async () => {
    abortRef.current = new AbortController()
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)

      const res = await fetch(`/api/chats?${params.toString()}`, {
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error('Gagal memuat chat')

      const data: ChatListResponse = await res.json()
      setChats(data.data)
      setError(null)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err as Error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchChats()
    const interval = setInterval(fetchChats, pollInterval)

    return () => {
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [fetchChats, pollInterval])

  return { chats, isLoading, error, refetch: fetchChats }
}

interface UseChatDetailOptions {
  pollInterval?: number
}

export function useChatDetail(chatId: number | null, options: UseChatDetailOptions = {}) {
  const { pollInterval = 3000 } = options
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchChatDetail = useCallback(async () => {
    if (!chatId) return

    abortRef.current = new AbortController()
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error('Gagal memuat detail chat')

      const data: ChatDetailResponse = await res.json()
      setChat(data.chat)
      setMessages(data.messages)
      setError(null)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err as Error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    if (chatId) {
      setIsLoading(true)
      fetchChatDetail()
      const interval = setInterval(fetchChatDetail, pollInterval)

      return () => {
        clearInterval(interval)
        abortRef.current?.abort()
      }
    }
  }, [chatId, fetchChatDetail, pollInterval])

  const sendMessage = useCallback(async (content: string) => {
    if (!chatId) return

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Gagal mengirim pesan')

      await fetchChatDetail()
    } catch (err) {
      setError(err as Error)
    }
  }, [chatId, fetchChatDetail])

  const takeover = useCallback(async () => {
    if (!chatId) return

    try {
      const res = await fetch(`/api/chats/${chatId}/takeover`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Gagal mengambil alih chat')

      await fetchChatDetail()
    } catch (err) {
      setError(err as Error)
    }
  }, [chatId, fetchChatDetail])

  const resolve = useCallback(async () => {
    if (!chatId) return

    try {
      const res = await fetch(`/api/chats/${chatId}/resolve`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Gagal menyelesaikan chat')

      await fetchChatDetail()
    } catch (err) {
      setError(err as Error)
    }
  }, [chatId, fetchChatDetail])

  return {
    chat,
    messages,
    isLoading,
    error,
    sendMessage,
    takeover,
    resolve,
    refetch: fetchChatDetail,
  }
}
