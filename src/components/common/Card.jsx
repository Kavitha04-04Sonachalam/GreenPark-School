export default function Card({ children, className = '', clickable = false, highlight = false }) {
  return (
    <div
      className={`bg-white rounded-lg transition-all duration-200 p-6 ${
        highlight 
          ? 'border-t-4 border-schoolGreen shadow-md' 
          : 'border border-gray-200 shadow-sm'
      } ${
        clickable ? 'cursor-pointer hover:border-schoolGreen hover:shadow-md' : 'hover:shadow-md'
      } ${className}`}
    >
      {children}
    </div>
  )
}
