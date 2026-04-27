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
    { href: '/notifications', label: 'Notifications' },
    { href: '/fees', label: 'Fees' },
    { href: '/marks', label: 'Marks' },
    { href: '/events', label: 'Events' },
    { href: '/gallery', label: 'Gallery' }
  ]

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/parents', label: 'Parents' },
    { href: '/admin/marks', label: 'Marks' },
    { href: '/admin/notifications', label: 'Notifications' },
    { href: '/admin/activities', label: 'Activities' },
    { href: '/admin/gallery', label: 'Gallery' },
    { href: '/admin/fees', label: 'Fees' },
    { href: '/admin/password-resets', label: 'Resets' }
  ]

  const navItems = isAdmin ? adminNavItems : parentNavItems

  const isActive = (href) => location.pathname === href

  return (
    <div className="fixed top-0 left-0 w-full z-50 shadow-md">
      <TopContactBar />
      <header className="bg-white border-b-4 border-schoolYellow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and School Name */}
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center flex-shrink-0">
            <img src="/school-logo.jpg" alt="Green Park School" className="h-12 md:h-16 object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-2 py-2 xl:px-3 rounded-lg text-sm font-medium transition whitespace-nowrap ${isActive(item.href)
                  ? 'text-schoolGreen border-b-2 border-schoolGreen bg-green-50/50'
                  : 'text-gray-700 hover:text-schoolGreen hover:bg-gray-50'
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
            <MobileHamburger 
              navItems={navItems} 
              user={user} 
              studentSwitcher={user?.role === 'parent' ? <StudentSwitcher /> : null} 
            />
          </div>
        </div>
      </header>
    </div>
  )
}
