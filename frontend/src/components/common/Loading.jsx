export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/50">
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200/50 border-t-schoolGreen border-r-schoolYellow"></div>
      </div>
      <p className="mt-4 text-gray-700 font-extrabold text-[11px] uppercase tracking-widest text-center select-none animate-pulse">{message}</p>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-schoolGreen border-r-schoolYellow"></div>
    </div>
  )
}

