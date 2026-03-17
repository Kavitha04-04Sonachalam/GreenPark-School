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
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/parents', label: 'Parents' },
    { href: '/admin/attendance', label: 'Attendance' },
    { href: '/admin/marks', label: 'Marks' },
    { href: '/admin/announcements', label: 'Announcements' },
    { href: '/admin/activities', label: 'Activities' },
    { href: '/admin/fees', label: 'Fees' },
    { href: '/admin/password-resets', label: 'Resets' }
  ]

  const navItems = isAdmin ? adminNavItems : parentNavItems

  const isActive = (href) => location.pathname === href

  return (
    <>
      <TopContactBar />
      <header className="bg-white border-b-4 border-schoolYellow sticky top-0 z-40 shadow-sm">
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
    </>
  )
}
