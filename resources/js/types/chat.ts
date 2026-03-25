export type ChatStatus = 'bot' | 'admin' | 'resolved'

export interface Customer {
  id: number
  phone: string
  name: string
  avatar?: string
}

export interface Message {
  id: number
  chatId: number
  content: string
  type: 'text' | 'image' | 'document' | 'audio'
  direction: 'inbound' | 'outbound'
  sender: 'customer' | 'bot' | 'admin'
  timestamp: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
}

export interface Chat {
  id: number
  customer: Customer
  status: ChatStatus
  lastMessage?: Message
  unreadCount: number
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export interface ChatListResponse {
  data: Chat[]
  meta: {
    currentPage: number
    lastPage: number
    total: number
  }
}

export interface ChatDetailResponse {
  chat: Chat
  messages: Message[]
}
