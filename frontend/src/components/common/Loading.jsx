import { Loader } from 'lucide-react'

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin">
        <Loader size={48} className="text-schoolGreen" />
      </div>
      <p className="mt-4 text-lg text-gray-600">{message}</p>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin">
        <Loader size={32} className="text-schoolGreen" />
      </div>
    </div>
  )
}
