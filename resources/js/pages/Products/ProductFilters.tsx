import { type ProductFilters as Filters, type ProductType, type ProductStatus } from './types'

interface ProductFiltersProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
}

export function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value })
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, type: e.target.value as ProductType | '' })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value as ProductStatus | '' })
  }

  const handleClearFilters = () => {
    onFilterChange({ search: '', type: '', status: '' })
  }

  const hasActiveFilters = filters.search || filters.type || filters.status

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Cari produk
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
              placeholder="Cari nama produk..."
              className="block w-full rounded-md border-gray-300 pl-10 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="w-full sm:w-40">
          <label htmlFor="type" className="sr-only">
            Filter tipe
          </label>
          <select
            id="type"
            value={filters.type}
            onChange={handleTypeChange}
            className="block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Semua Tipe</option>
            <option value="telur">Telur</option>
            <option value="ayam">Ayam</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-40">
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
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="out_of_stock">Stok Habis</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
        )}
      </div>
    </div>
  )
}
