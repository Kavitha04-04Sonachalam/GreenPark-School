import { useError } from '../../context/ErrorContext'
import { X } from 'lucide-react'

export default function ErrorDisplay() {
  const { errors, removeError } = useError()

  if (errors.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {errors.map(error => (
        <div
          key={error.id}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error.message}</p>
          </div>
          <button
            onClick={() => removeError(error.id)}
            className="ml-4 text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
