import { useState, useEffect, Suspense } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loading from '../common/Loading'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar
} from '../ui/sidebar'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  FileText, 
  Bell, 
  Settings, 
  LogOut, 
  Phone, 
  Image, 
  BookOpen, 
  Lock, 
  ClipboardList,
  Layers,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react'
import NotificationBell from '../header/NotificationBell'
import ProfileDropdown from '../header/ProfileDropdown'
import StudentSwitcher from '../common/StudentSwitcher'
import ErrorDisplay from '../common/ErrorDisplay'
import FloatingWhatsApp from '../common/FloatingWhatsApp'

function DashboardLayoutContent() {
  const { user, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSidebarClick = (e) => {
    const target = e.target.closest('a')
    if (target && isMobile) {
      setOpenMobile(false)
    }
  }

  if (!user) return null

  // Collapsible state for Admin groups
  const [openGroups, setOpenGroups] = useState({
    students: location.pathname.startsWith('/admin/students'),
    fees: location.pathname.startsWith('/admin/fees') || location.pathname.startsWith('/admin/reports')
  })

  // Synchronize open state with path changes
  useEffect(() => {
    if (location.pathname.startsWith('/admin/students')) {
      setOpenGroups(prev => ({ ...prev, students: true }))
    }
    if (location.pathname.startsWith('/admin/fees') || location.pathname.startsWith('/admin/reports')) {
      setOpenGroups(prev => ({ ...prev, fees: true }))
    }
  }, [location.pathname])

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isLinkActive = (href) => {
    if (href.includes('?')) {
      const [path, search] = href.split('?')
      return location.pathname === path && location.search.includes(search)
    }
    if (href === '/') {
      return location.pathname === '/'
    }
    if (href === '/admin' || href === '/student/dashboard' || href === '/staff/dashboard') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const isGroupActive = (group) => {
    if (group === 'students') {
      return location.pathname.startsWith('/admin/students')
    }
    if (group === 'fees') {
      return location.pathname.startsWith('/admin/fees') || location.pathname.startsWith('/admin/reports')
    }
    return false
  }

  // Render Admin Navigation
  const renderAdminNav = () => {
    const studentsActive = isGroupActive('students')
    const feesActive = isGroupActive('fees')

    return (
      <div className="space-y-1">
        {/* Dashboard */}
        <Link 
          to="/admin" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
            isLinkActive('/admin') 
              ? 'bg-[#155333] text-white font-semibold' 
              : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} className={isLinkActive('/admin') ? 'text-[#FACC15]' : 'text-green-300'} />
          <span>Dashboard</span>
        </Link>

        {/* Students Group */}
        <div>
          <button 
            onClick={() => toggleGroup('students')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
              studentsActive 
                ? 'bg-[#155333]/40 text-white font-semibold'
                : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <GraduationCap size={18} className={studentsActive ? 'text-[#FACC15]' : 'text-green-300'} />
              <span>Students</span>
            </div>
            {openGroups.students ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openGroups.students && (
            <div className="mt-1 ml-4 pl-3 border-l border-green-700/60 space-y-1">
              <Link 
                to="/admin/students"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isLinkActive('/admin/students') && !location.pathname.endsWith('/promote')
                    ? 'bg-[#155333] text-white font-semibold' 
                    : 'text-green-200 hover:bg-[#155333]/40 hover:text-white'
                }`}
              >
                <User size={16} />
                <span>Student Records</span>
              </Link>
              <Link 
                to="/admin/students/promote"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isLinkActive('/admin/students/promote') 
                    ? 'bg-[#155333] text-white font-semibold' 
                    : 'text-green-200 hover:bg-[#155333]/40 hover:text-white'
                }`}
              >
                <Layers size={16} />
                <span>Promotion Management</span>
              </Link>
            </div>
          )}
        </div>

        {/* Staff */}
        <Link 
          to="/admin/staff" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
            isLinkActive('/admin/staff') 
              ? 'bg-[#155333] text-white font-semibold' 
              : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
          }`}
        >
          <UserCheck size={18} className={isLinkActive('/admin/staff') ? 'text-[#FACC15]' : 'text-green-300'} />
          <span>Staff</span>
        </Link>

        {/* Fees Group */}
        <div>
          <button 
            onClick={() => toggleGroup('fees')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
              feesActive 
                ? 'bg-[#155333]/40 text-white font-semibold'
                : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard size={18} className={feesActive ? 'text-[#FACC15]' : 'text-green-300'} />
              <span>Fees</span>
            </div>
            {openGroups.fees ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openGroups.fees && (
            <div className="mt-1 ml-4 pl-3 border-l border-green-700/60 space-y-1">
              <Link 
                to="/admin/fees?tab=years"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isLinkActive('/admin/fees?tab=years')
                    ? 'bg-[#155333] text-white font-semibold' 
                    : 'text-green-200 hover:bg-[#155333]/40 hover:text-white'
                }`}
              >
                <Calendar size={16} />
                <span>Academic Years</span>
              </Link>
              <Link 
                to="/admin/fees?tab=categories"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isLinkActive('/admin/fees?tab=categories')
                    ? 'bg-[#155333] text-white font-semibold' 
                    : 'text-green-200 hover:bg-[#155333]/40 hover:text-white'
                }`}
              >
                <Layers size={16} />
                <span>Fee Categories</span>
              </Link>
              <Link 
                to="/admin/fees?tab=structures"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isLinkActive('/admin/fees?tab=structures')
                    ? 'bg-[#155333] text-white font-semibold' 
                    : 'text-green-200 hover:bg-[#155333]/40 hover:text-white'
                }`}
              >
                <FileText size={16} />
                <span>Fee Structures</span>
              </Link>
              <Link 
                to="/admin/fees?tab=scholarships"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isLinkActive('/admin/fees?tab=scholarships')
                    ? 'bg-[#155333] text-white font-semibold' 
                    : 'text-green-200 hover:bg-[#155333]/40 hover:text-white'
                }`}
              >
                <GraduationCap size={16} />
                <span>Scholarships</span>
              </Link>
              <Link 
                to="/admin/reports"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  isLinkActive('/admin/reports')
                    ? 'bg-[#155333] text-white font-semibold' 
                    : 'text-green-200 hover:bg-[#155333]/40 hover:text-white'
                }`}
              >
                <FileText size={16} />
                <span>Financial Reports</span>
              </Link>
            </div>
          )}
        </div>

        {/* Gallery */}
        <Link 
          to="/admin/gallery" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
            isLinkActive('/admin/gallery') 
              ? 'bg-[#155333] text-white font-semibold' 
              : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
          }`}
        >
          <Image size={18} className={isLinkActive('/admin/gallery') ? 'text-[#FACC15]' : 'text-green-300'} />
          <span>Gallery</span>
        </Link>

        {/* Announcements */}
        <Link 
          to="/admin/announcements" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
            isLinkActive('/admin/announcements') || isLinkActive('/admin/notifications')
              ? 'bg-[#155333] text-white font-semibold' 
              : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
          }`}
        >
          <Bell size={18} className={isLinkActive('/admin/announcements') || isLinkActive('/admin/notifications') ? 'text-[#FACC15]' : 'text-green-300'} />
          <span>Announcements</span>
        </Link>

        {/* Admission Enquiries */}
        <Link 
          to="/admin/admission-enquiries" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
            isLinkActive('/admin/admission-enquiries') 
              ? 'bg-[#155333] text-white font-semibold' 
              : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
          }`}
        >
          <Phone size={18} className={isLinkActive('/admin/admission-enquiries') ? 'text-[#FACC15]' : 'text-green-300'} />
          <span>Admission Enquiries</span>
        </Link>

        {/* User Management */}
        <Link 
          to="/admin/password-resets" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
            isLinkActive('/admin/password-resets') || isLinkActive('/admin/users')
              ? 'bg-[#155333] text-white font-semibold' 
              : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
          }`}
        >
          <Lock size={18} className={isLinkActive('/admin/password-resets') ? 'text-[#FACC15]' : 'text-green-300'} />
          <span>User Management</span>
        </Link>

        {/* Settings */}
        <Link 
          to="/admin/settings" 
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
            isLinkActive('/admin/settings') 
              ? 'bg-[#155333] text-white font-semibold' 
              : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
          }`}
        >
          <Settings size={18} className={isLinkActive('/admin/settings') ? 'text-[#FACC15]' : 'text-green-300'} />
          <span>Settings</span>
        </Link>
      </div>
    )
  }

  // Render Other Roles' flat nav items
  const renderOtherNav = () => {
    let items = []
    
    if (user.role === 'student') {
      items = [
        { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/student/attendance', label: 'My Attendance', icon: UserCheck },
        { href: '/student/marks', label: 'My Marks', icon: FileText },
        { href: '/student/fees', label: 'My Fees', icon: CreditCard },
        { href: '/student/announcements', label: 'Announcements', icon: Bell },
        { href: '/student/profile', label: 'My Profile', icon: BookOpen },
      ]
    } else if (user.role === 'staff') {
      items = [
        { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/staff/students', label: 'Student Records', icon: Users },
        { href: '/staff/attendance', label: 'Mark Attendance', icon: UserCheck },
        { href: '/staff/fees', label: 'Fee Overviews', icon: CreditCard },
        { href: '/staff/announcements', label: 'Announcements', icon: Bell },
        { href: '/staff/profile', label: 'My Profile', icon: BookOpen },
      ]
    } else {
      // Parent
      items = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/attendance', label: 'Attendance', icon: UserCheck },
        { href: '/fees', label: 'Fees Payment', icon: CreditCard },
        { href: '/marks', label: 'Marks & Reports', icon: FileText },
        { href: '/events', label: 'School Events', icon: Calendar },
        { href: '/gallery', label: 'School Gallery', icon: Image },
        { href: '/notifications', label: 'Notifications', icon: Bell },
        { href: '/profile', label: 'My Profile', icon: BookOpen },
        { href: '/settings', label: 'Settings', icon: Settings },
        { href: '/contact-us', label: 'Contact Us', icon: Phone },
      ]
    }

    return (
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isLinkActive(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition duration-200 ${
                active
                  ? 'bg-[#155333] text-white font-semibold'
                  : 'text-green-100 hover:bg-[#155333]/60 hover:text-white'
              }`}
            >
              <Icon size={18} className={active ? 'text-[#FACC15]' : 'text-green-300'} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        onClick={handleSidebarClick}
        className="border-r-4 border-schoolYellow bg-[#0B4426] text-white dark:bg-[#0B4426] [&_[data-sidebar=sidebar]]:bg-[#0B4426] [&_[data-sidebar=sidebar]]:text-white"
      >
          
          {/* Header */}
          <SidebarHeader className="border-b border-green-800 p-4 bg-[#0B4426]">
            <Link to={user.role === 'admin' ? '/admin' : user.role === 'student' ? '/student/dashboard' : user.role === 'staff' ? '/staff/dashboard' : '/'} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center p-1.5 shadow-md flex-shrink-0">
                <img
                  src="/school-logo.jpg"
                  alt="Green Park School Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-base leading-tight uppercase tracking-wide">Green Park</span>
                <span className="text-[10px] text-schoolYellow font-black uppercase tracking-widest">School Portal</span>
              </div>
            </Link>
          </SidebarHeader>

          {/* Content */}
          <SidebarContent className="py-4 bg-[#0B4426]">
            <SidebarGroup>
              <SidebarGroupContent>
                {user.role === 'admin' ? renderAdminNav() : renderOtherNav()}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="border-t border-green-800 p-4 bg-[#08351D]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-9 w-9 rounded-full bg-white text-schoolGreen flex items-center justify-center font-black flex-shrink-0 border-2 border-schoolYellow shadow-sm">
                  {user.name?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-white truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-schoolYellow uppercase tracking-wider font-extrabold capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-green-300 hover:text-[#FACC15] hover:bg-[#155333] rounded-lg transition-colors flex items-center justify-center"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Content Area */}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden bg-gray-50/50">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-500 hover:bg-gray-100 rounded-md" />
              <div className="h-4 w-[1px] bg-gray-200" />
              <span className="text-sm font-semibold text-gray-700 capitalize">
                {location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/student/dashboard' || location.pathname === '/staff/dashboard'
                  ? 'Dashboard Overview' 
                  : location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {user.role === 'parent' && <StudentSwitcher />}
              <NotificationBell />
              <ProfileDropdown />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">
            <Suspense fallback={<Loading message="Loading Page..." />}>
              <Outlet />
            </Suspense>
          </main>

          {/* WhatsApp Float - Parent only */}
          {user.role === 'parent' && <FloatingWhatsApp />}
          
          {/* Error Handler Overlay */}
          <ErrorDisplay />
        </SidebarInset>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  )
}