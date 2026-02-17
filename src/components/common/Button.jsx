export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-schoolGreen text-white hover:bg-opacity-90 disabled:bg-gray-400',
    secondary: 'bg-schoolYellow text-schoolGreen hover:bg-opacity-90 disabled:bg-gray-300',
    outline: 'border border-schoolGreen text-schoolGreen hover:bg-schoolGreen hover:text-white disabled:border-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400',
    ghost: 'text-schoolGreen hover:bg-schoolGreen hover:text-white disabled:text-gray-400'
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
