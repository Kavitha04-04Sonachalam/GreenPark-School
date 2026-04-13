import { useState, useRef, useEffect } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MobileHamburger({ navItems, studentSwitcher }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lock scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = () => {
    // 1. Clear authentication data and state
    logout()
    // 2. Close the mobile menu
    setIsOpen(false)
    // 3. Redirect user to login page
    navigate('/login')
  }

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={toggleMenu}
        className="xl:hidden p-2 text-schoolGreen hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
        aria-label={isOpen ? "Close Menu" : "Open Menu"}
      >
        {isOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 top-[110px] bg-black/60 z-[60] xl:hidden backdrop-blur-sm" onClick={closeMenu}>
          <div 
            className="absolute top-0 right-0 w-72 h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" 
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Header Info */}
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-schoolGreen text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  {user?.name?.[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 truncate capitalize font-medium tracking-wider">{user?.role} Account</p>
                </div>
              </div>
              <button 
                onClick={closeMenu}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Navigation</p>
              <div className="space-y-1">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 text-schoolGreen hover:bg-green-50 rounded-xl font-semibold transition-all group"
                    onClick={closeMenu}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-schoolGreen transition-colors" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {studentSwitcher && (
                <div className="mt-8 pt-6 border-t border-gray-100 px-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Switch Student</p>
                  <div onClick={(e) => {
                    // Prevent closing menu immediately if student switcher has internal logic
                    // but usually you want to close it after selection
                    if (e.target.closest('button') || e.target.closest('a')) {
                        // Keep open for selection or close based on preference
                        // setIsOpen(false); 
                    }
                  }}>
                    {studentSwitcher}
                  </div>
                </div>
              )}
            </nav>

            <div className="p-5 border-t border-gray-100 bg-white">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all border border-red-100 group"
              >
                <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
