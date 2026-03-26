import { cn, formatTime, truncate } from "@/lib/utils";
import type { Chat, ChatStatus } from "@/types/chat";

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: number;
  onSelectChat: (chat: Chat) => void;
  isLoading?: boolean;
  statusFilter: ChatStatus | "all";
  onStatusFilterChange: (status: ChatStatus | "all") => void;
  onBroadcastClick?: () => void;
}

const statusFilters: { value: ChatStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "bot", label: "Bot" },
  { value: "admin", label: "Admin" },
  { value: "resolved", label: "Selesai" },
];

const statusIndicator: Record<ChatStatus, { color: string; label: string }> = {
  bot: { color: "bg-purple-500", label: "Bot" },
  admin: { color: "bg-blue-500", label: "Admin" },
  resolved: { color: "bg-green-500", label: "Selesai" },
};

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  onBroadcastClick,
}: ChatListProps) {
  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <header className="border-b border-gray-200 p-3 dark:border-gray-700 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Inbox Chat
          </h2>
          {onBroadcastClick && (
            <button
              type="button"
              onClick={onBroadcastClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              Broadcast
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="search"
            placeholder="Cari chat..."
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm",
              "placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500",
              "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-green-500",
            )}
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatusFilterChange(filter.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === filter.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse rounded-lg p-3">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <svg
              className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tidak ada chat
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onSelectChat(chat)}
                  className={cn(
                    "flex w-full gap-3 p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:p-4",
                    selectedChatId === chat.id &&
                      "bg-green-50 dark:bg-green-900/20",
                  )}
                >
                  <div className="relative shrink-0">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                      aria-hidden="true"
                    >
                      {chat.customer.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800",
                        statusIndicator[chat.status].color,
                      )}
                      title={statusIndicator[chat.status].label}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {chat.customer.name}
                      </span>
                      {chat.lastMessage && (
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                        {chat.lastMessage
                          ? truncate(chat.lastMessage.content, 40)
                          : "Belum ada pesan"}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-medium text-white">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
