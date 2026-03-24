import { cn, formatTime } from '@/lib/utils'
import type { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'

  const senderLabel = {
    customer: null,
    bot: 'Bot',
    admin: 'Admin',
  }[message.sender]

  const statusIcon = {
    sent: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    delivered: (
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 8l4 4L19 2" />
      </svg>
    ),
    read: (
      <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 8l4 4L19 2" />
      </svg>
    ),
    failed: (
      <svg className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div className={cn('flex w-full', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[70%]',
          isOutbound
            ? 'rounded-br-md bg-green-600 text-white'
            : 'rounded-bl-md bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
        )}
      >
        {senderLabel && (
          <span
            className={cn(
              'mb-1 block text-xs font-medium',
              isOutbound ? 'text-green-200' : 'text-gray-500 dark:text-gray-400',
              message.sender === 'bot' && 'text-purple-600 dark:text-purple-400'
            )}
          >
            {senderLabel}
          </span>
        )}

        {message.type === 'text' && <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>}

        {message.type === 'image' && (
          <img src={message.content} alt="Gambar" className="max-h-60 rounded-lg" loading="lazy" />
        )}

        {message.type === 'document' && (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 text-sm underline',
              isOutbound ? 'text-green-100' : 'text-blue-600 dark:text-blue-400'
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Dokumen
          </a>
        )}

        {message.type === 'audio' && (
          <audio controls className="max-w-full">
            <source src={message.content} />
          </audio>
        )}

        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1 text-xs',
            isOutbound ? 'text-green-200' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          <span>{formatTime(message.timestamp)}</span>
          {isOutbound && message.status && statusIcon[message.status]}
        </div>
      </div>
    </div>
  )
}
