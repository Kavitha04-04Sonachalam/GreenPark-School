import { useState, useRef, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MobileHamburger({ navItems, user, studentSwitcher }) {
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
        className="md:hidden p-2 text-schoolGreen hover:bg-gray-100 rounded-lg flex items-center justify-center"
        aria-label="Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="fixed top-[110px] left-0 right-0 bottom-0 bg-black/50 z-50 md:hidden" onClick={() => setIsOpen(false)}>
          <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Mobile Header Info */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Settings & Student</p>
              {studentSwitcher && (
                <div className="mb-4">
                  {studentSwitcher}
                </div>
              )}
              {user && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-schoolGreen text-white flex items-center justify-center text-sm font-bold">
                    {user.name?.[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500 truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto pt-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</p>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block px-4 py-3 text-schoolGreen hover:bg-schoolYellow font-medium transition-colors border-l-4 border-transparent hover:border-schoolGreen"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  // logout logic should be here if needed, but usually profile dropdown has it
                }}
                className="w-full text-left text-sm text-red-600 font-bold p-2 hover:bg-red-50 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
