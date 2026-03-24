import { type OrderFilters as Filters, type OrderStatus } from './types'
import { getStatusOptions } from './StatusBadge'

interface OrderFiltersProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
}

export function OrderFilters({ filters, onFilterChange }: OrderFiltersProps) {
  const statusOptions = getStatusOptions()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value as OrderStatus | '' })
  }

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, date_from: e.target.value })
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, date_to: e.target.value })
  }

  const handleClearFilters = () => {
    onFilterChange({ search: '', status: '', date_from: '', date_to: '' })
  }

  const hasActiveFilters = filters.search || filters.status || filters.date_from || filters.date_to

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex flex-col gap-3">
        {/* Row 1: Search and Status */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Cari order
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Cari no. order atau nama customer..."
                className="block w-full rounded-md border-gray-300 pl-10 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <label htmlFor="status" className="sr-only">
              Filter status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={handleStatusChange}
              className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date Range */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Date From */}
          <div className="flex-1">
            <label htmlFor="date_from" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              id="date_from"
              value={filters.date_from}
              onChange={handleDateFromChange}
              className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Date To */}
          <div className="flex-1">
            <label htmlFor="date_to" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              id="date_to"
              value={filters.date_to}
              onChange={handleDateToChange}
              className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="sm:self-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <svg
                  className="mr-1.5 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
