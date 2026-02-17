import { useState, useRef, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function MobileHamburger({ navItems }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-schoolGreen hover:bg-gray-100 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 right-0 bg-white border-b border-gray-300 shadow-lg z-40 md:hidden">
          <nav className="flex flex-col">
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-3 border-b border-gray-200 text-schoolGreen hover:bg-schoolYellow font-medium text-sm"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
