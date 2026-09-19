import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useError } from '../context/ErrorContext'
import { LogIn, Phone, Eye, EyeOff } from 'lucide-react'
import TopContactBar from '../components/layout/TopContactBar'
import { getRoleFromPort, getPortForRole, redirectToPort } from '../lib/portHelper'

const roleConfigs = {
  parent: {
    title: 'Parent Portal Login',
    heading: 'Parent Portal',
    welcome: 'Welcome Back, Parent!',
    description: 'Access your child\'s academic updates, attendance, and fee details.',
  },
  student: {
    title: 'Student Portal Login',
    heading: 'Student Portal',
    welcome: 'Welcome Back, Student!',
    description: 'Access your classes, marks, and attendance details.',
  },
  staff: {
    title: 'Staff Portal Login',
    heading: 'Staff Portal',
    welcome: 'Welcome Back, Staff Member!',
    description: 'Manage student records, mark attendance, and post announcements.',
  },
  admin: {
    title: 'Admin Portal Login',
    heading: 'Admin Portal',
    welcome: 'Welcome Back, Administrator!',
    description: 'Manage users, configurations, and overall portal settings.',
  }
}

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  
  const { login } = useAuth()
  const { addError } = useError()
  const navigate = useNavigate()
  const location = useLocation()

  // Parse role from URL query param, default to admin if unspecified
  const queryParams = new URLSearchParams(location.search)
  const queryRole = queryParams.get('role')
  const defaultRole = queryRole && roleConfigs[queryRole] ? queryRole : 'admin'
  const [role, setRole] = useState(defaultRole)

  useEffect(() => {
    const qRole = new URLSearchParams(location.search).get('role')
    if (qRole && roleConfigs[qRole] && qRole !== role) {
      setRole(qRole)
    }
  }, [location.search])

  const handleRoleSelect = (newRole) => {
    setRole(newRole)
    setError(null)
    navigate(`/login?role=${newRole}`, { replace: true })
  }

  const config = roleConfigs[role] || roleConfigs.admin

  // Update Page Title and Document Title dynamically
  useEffect(() => {
    document.title = `${config.title} | Green Park School`
  }, [role, config])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!phoneNumber || !password) {
        setError('Please fill in all fields')
        setIsLoading(false)
        return
      }
      
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(phoneNumber)) {
        setError('Enter a valid 10-digit phone number')
        setIsLoading(false)
        return
      }

      const data = await login(phoneNumber, password, role)
      const targetRole = data?.user?.role || role
      
      // Redirect to the appropriate dashboard
      if (targetRole === 'admin') {
        navigate('/admin')
      } else if (targetRole === 'student') {
        navigate('/student/dashboard')
      } else if (targetRole === 'staff') {
        navigate('/staff/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setFailedAttempts(prev => prev + 1)
      setError(err.message || 'Invalid phone number or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value)
    if (error) setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <TopContactBar />

        {/* Branding header */}
        <div className="bg-white border-b-4 border-schoolYellow py-4 md:py-6 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center">
              <img
                src="/school-logo.jpg"
                alt="Green Park School Logo"
                className="h-16 md:h-24 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex items-center justify-center px-4 py-8 md:py-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
              {/* Header Gradient based on Role */}
              <div className="bg-gradient-to-r from-schoolGreen to-green-700 text-white p-6 md:p-8 text-center relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-green-500 rounded-full opacity-10 blur-xl"></div>
                <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-yellow-400 rounded-full opacity-10 blur-xl"></div>
                
                <h2 className="text-2xl font-bold tracking-tight">{config.heading}</h2>
                <p className="text-green-100 text-sm mt-2 font-medium">{config.welcome}</p>
                <p className="text-green-200 text-xs mt-3 opacity-90 leading-relaxed font-light">
                  {config.description}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
                {/* Role Switcher Tabs */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Login As:
                  </label>
                  <div className="grid grid-cols-4 bg-gray-100 p-1 rounded-xl gap-1">
                    {[
                      { id: 'admin', label: 'Admin' },
                      { id: 'staff', label: 'Staff' },
                      { id: 'parent', label: 'Parent' },
                      { id: 'student', label: 'Student' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRoleSelect(item.id)}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          role === item.id
                            ? 'bg-white text-schoolGreen shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Number Field */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={handleInputChange(setPhoneNumber)}
                      maxLength={10}
                      className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-4 outline-none transition duration-200 text-gray-800 ${
                        error
                          ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500 animate-shake'
                          : 'border-gray-300 focus:ring-schoolGreen/10 focus:border-schoolGreen'
                      }`}
                      placeholder="Enter 10-digit phone number"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-schoolGreen hover:text-green-800 font-medium transition"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-4 outline-none transition duration-200 text-gray-800 ${
                        error
                          ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500 animate-shake'
                          : 'border-gray-300 focus:ring-schoolGreen/10 focus:border-schoolGreen'
                      }`}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {error && (
                    <div className="mt-3 p-3 bg-red-50/90 border border-red-200 rounded-xl animate-fade-in text-sm text-red-600 font-medium">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0"></span>
                        <div className="flex-1">
                          <p>{error}</p>
                          {error.includes('registered as Admin') && (
                            <button
                              type="button"
                              onClick={() => handleRoleSelect('admin')}
                              className="mt-2 inline-flex items-center text-xs font-bold text-schoolGreen bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm transition"
                            >
                              👉 Switch to Admin Tab
                            </button>
                          )}
                          {error.includes('registered as Staff') && (
                            <button
                              type="button"
                              onClick={() => handleRoleSelect('staff')}
                              className="mt-2 inline-flex items-center text-xs font-bold text-schoolGreen bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm transition"
                            >
                              👉 Switch to Staff Tab
                            </button>
                          )}
                          {error.includes('registered as Parent') && (
                            <button
                              type="button"
                              onClick={() => handleRoleSelect('parent')}
                              className="mt-2 inline-flex items-center text-xs font-bold text-schoolGreen bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm transition"
                            >
                              👉 Switch to Parent Tab
                            </button>
                          )}
                          {error.includes('registered as Student') && (
                            <button
                              type="button"
                              onClick={() => handleRoleSelect('student')}
                              className="mt-2 inline-flex items-center text-xs font-bold text-schoolGreen bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm transition"
                            >
                              👉 Switch to Student Tab
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {failedAttempts >= 3 && !error && (
                  <div className="animate-fade-in">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-schoolYellow bg-schoolGreen px-3.5 py-2.5 rounded-xl border border-schoolYellow/20 hover:bg-opacity-95 transition flex items-center justify-center gap-2 font-medium"
                    >
                      <span>Need help?</span>
                      <span className="underline">Reset Password</span>
                    </Link>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-schoolGreen text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-opacity-95 hover:shadow-lg hover:shadow-green-800/10 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Login
                    </>
                  )}
                </button>

                {/* Parent Sign Up / Admission Enquiry links */}
                {role === 'parent' ? (
                  <div className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100 flex flex-col gap-2">
                    <div>
                      Don't have a parent account?{' '}
                      <Link
                        to="/signup"
                        className="text-schoolGreen hover:text-green-800 font-semibold transition"
                      >
                        Sign Up
                      </Link>
                    </div>
                    <div>
                      <Link
                        to="/admission-enquiry"
                        className="text-schoolGreen hover:text-green-800 font-semibold transition inline-flex items-center gap-1.5"
                      >
                        📝 Admission Enquiry
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm pt-2 border-t border-gray-100">
                    <Link
                      to="/admission-enquiry"
                      className="text-schoolGreen hover:text-green-800 font-semibold transition inline-flex items-center gap-1.5"
                    >
                      📝 Admission Enquiry
                    </Link>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="py-6 text-center text-xs text-gray-400 bg-white border-t border-gray-100 w-full mt-auto">
        <p>© {new Date().getFullYear()} Green Park School. All rights reserved.</p>
      </div>
    </div>
  )
}
