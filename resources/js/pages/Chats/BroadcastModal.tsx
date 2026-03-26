import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface Customer {
  id: number;
  phone: string;
  name: string;
  status: string;
  last_active: string | null;
}

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BroadcastStatus = "idle" | "loading" | "sending" | "success" | "error";

interface BroadcastProgress {
  broadcastId: number;
  status: string;
  total: number;
  sent: number;
  failed: number;
  progress: number;
}

export function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set(),
  );
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BroadcastStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<BroadcastProgress | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setStatus("loading");
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(
        `/broadcast/customers?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "same-origin",
        },
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data customers");
      }

      const data = await response.json();
      setCustomers(data.data || []);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setStatus("error");
    }
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, fetchCustomers]);

  // Toggle customer selection
  const toggleCustomer = (phone: string) => {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) {
        next.delete(phone);
      } else {
        next.add(phone);
      }
      return next;
    });
  };

  // Select all customers
  const selectAll = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map((c) => c.phone)));
    }
  };

  // Poll broadcast status
  const pollStatus = useCallback(async (broadcastId: number) => {
    try {
      const response = await fetch(`/broadcast/${broadcastId}/status`, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });

      if (!response.ok) return;

      const data = await response.json();
      setProgress({
        broadcastId,
        status: data.data.status,
        total: data.data.total_recipients,
        sent: data.data.sent_count,
        failed: data.data.failed_count,
        progress: data.data.progress,
      });

      if (data.data.status === "completed" || data.data.status === "failed") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        setStatus(data.data.status === "completed" ? "success" : "error");
        if (data.data.status === "failed") {
          setError(data.data.error_message || "Broadcast gagal");
        }
      }
    } catch {
      // Ignore polling errors
    }
  }, []);

  // Send broadcast
  const sendBroadcast = async () => {
    if (selectedCustomers.size === 0 || !message.trim()) {
      setError("Pilih minimal satu customer dan tulis pesan");
      return;
    }

    setStatus("sending");
    setError(null);

    try {
      // Get CSRF token from meta tag
      const csrfToken =
        document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute("content") || "";

      const response = await fetch("/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          recipients: Array.from(selectedCustomers),
          message: message.trim(),
          type: "manual",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengirim broadcast");
      }

      const broadcastId = data.data.broadcast_id;

      // Start polling
      pollingRef.current = setInterval(() => {
        pollStatus(broadcastId);
      }, 2000);

      // Initial poll
      pollStatus(broadcastId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setStatus("error");
    }
  };

  // Reset modal state
  const handleClose = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setSelectedCustomers(new Set());
    setMessage("");
    setSearch("");
    setStatus("idle");
    setError(null);
    setProgress(null);
    setShowPreview(false);
    onClose();
  };

  // Filter customers by search
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Broadcast Pesan
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            aria-label="Tutup"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Progress View */}
          {(status === "sending" ||
            status === "success" ||
            (status === "error" && progress)) && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {status === "sending" && (
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
                )}
                {status === "success" && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {status === "error" && progress && (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {progress && (
                <>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {status === "sending" && "Mengirim pesan..."}
                      {status === "success" && "Broadcast selesai!"}
                      {status === "error" && "Broadcast gagal"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {progress.sent} terkirim, {progress.failed} gagal dari{" "}
                      {progress.total} penerima
                    </p>
                  </div>

                  <div className="relative h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        status === "error" ? "bg-red-500" : "bg-green-500",
                      )}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-center text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Preview View */}
          {showPreview && status === "idle" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview Pesan
                </h3>
                <div className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100">
                  {message}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Penerima ({selectedCustomers.size})
                </h3>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {Array.from(selectedCustomers).map((phone) => {
                    const customer = customers.find((c) => c.phone === phone);
                    return (
                      <li
                        key={phone}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        {customer?.name || "Unknown"} - {phone}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Form View */}
          {!showPreview &&
            status !== "sending" &&
            status !== "success" &&
            !(status === "error" && progress) && (
              <div className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Message Input */}
                <div>
                  <label
                    htmlFor="broadcast-message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Pesan
                  </label>
                  <textarea
                    id="broadcast-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis pesan broadcast..."
                    className={cn(
                      "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
                      "placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500",
                      "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
                    )}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {message.length}/4096 karakter
                  </p>
                </div>

                {/* Customer Selection */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pilih Penerima
                    </label>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-green-600 hover:text-green-700 dark:text-green-400"
                    >
                      {selectedCustomers.size === customers.length
                        ? "Batalkan Semua"
                        : "Pilih Semua"}
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative mt-2">
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari nama atau nomor..."
                      className={cn(
                        "w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm",
                        "placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500",
                        "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
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

                  {/* Customer List */}
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {status === "loading" ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Tidak ada customer ditemukan
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredCustomers.map((customer) => (
                          <li key={customer.id}>
                            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <input
                                type="checkbox"
                                checked={selectedCustomers.has(customer.phone)}
                                onChange={() => toggleCustomer(customer.phone)}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {customer.name}
                                </p>
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {customer.phone}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                                  customer.status === "bot" &&
                                    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                                  customer.status === "admin" &&
                                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                  customer.status === "resolved" &&
                                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                  customer.status === "active" &&
                                    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                                )}
                              >
                                {customer.status}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {selectedCustomers.size} penerima dipilih
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {status === "success" || (status === "error" && progress) ? (
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Selesai
            </button>
          ) : showPreview ? (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={sendBroadcast}
                disabled={status === "sending"}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                  status === "sending"
                    ? "cursor-not-allowed bg-green-400"
                    : "bg-green-600 hover:bg-green-700",
                )}
              >
                {status === "sending" ? "Mengirim..." : "Kirim Sekarang"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={selectedCustomers.size === 0 || !message.trim()}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                  selectedCustomers.size === 0 || !message.trim()
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-green-600 hover:bg-green-700",
                )}
              >
                Preview
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
