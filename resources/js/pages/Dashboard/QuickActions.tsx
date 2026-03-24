import { ReactNode } from 'react'

interface QuickAction {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
}

interface QuickActionsProps {
  actions: QuickAction[]
}

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${variantClasses[action.variant || 'secondary']}`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
