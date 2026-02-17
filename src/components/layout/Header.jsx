import { Link, useLocation } from 'react-router-dom'
import TopContactBar from './TopContactBar'
import NotificationBell from '../header/NotificationBell'
import ProfileDropdown from '../header/ProfileDropdown'
import MobileHamburger from '../header/MobileHamburger'
import StudentSwitcher from '../common/StudentSwitcher'
import { useAuth } from '../../context/AuthContext'

export default function Header({ isAdmin = false }) {
  const { user } = useAuth()
  const location = useLocation()

  const parentNavItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/fees', label: 'Fees' },
    { href: '/attendance', label: 'Attendance' },
    { href: '/marks', label: 'Marks' },
    { href: '/events', label: 'Events' }
  ]

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/fees', label: 'Fee Management' },
    { href: '/admin/announcements', label: 'Announcements' }
  ]

  const navItems = isAdmin ? adminNavItems : parentNavItems

  const isActive = (href) => location.pathname === href

  return (
    <>
      <TopContactBar />
      <header className="bg-white border-b-4 border-schoolYellow sticky top-8 md:top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and School Name */}
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-3 flex-shrink-0">
            <img src="/school-logo.jpg" alt="Green Park School" className="h-14 md:h-16 object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-schoolGreen">Green Park</h1>
              <p className="text-xs text-gray-600">Parent Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition ${isActive(item.href)
                    ? 'text-schoolGreen border-b-2 border-schoolGreen'
                    : 'text-gray-700 hover:text-schoolGreen'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Student Switcher - Parent only */}
            {user && user.role === 'parent' && (
              <div className="hidden lg:block">
                <StudentSwitcher />
              </div>
            )}

            {/* Notification Bell */}
            {user && <NotificationBell />}

            {/* Profile Dropdown */}
            {user && <ProfileDropdown />}

            {/* Mobile Hamburger */}
            <MobileHamburger navItems={navItems} />
          </div>
        </div>
      </header>
    </>
  )
}
