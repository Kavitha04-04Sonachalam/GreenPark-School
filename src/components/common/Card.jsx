export default function Card({ children, className = '', clickable = false }) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 ${
        clickable ? 'cursor-pointer hover:border-schoolGreen' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
