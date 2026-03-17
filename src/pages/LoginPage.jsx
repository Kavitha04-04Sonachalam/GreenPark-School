import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useError } from '../context/ErrorContext'
import { LogIn, Phone, Eye, EyeOff } from 'lucide-react'
import TopContactBar from '../components/layout/TopContactBar'


export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('parent') // default role
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const { addError } = useError()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!phoneNumber || !password) {
        throw new Error('Please fill in all fields')
      }
      await login(phoneNumber, password, role)
      navigate(role === 'admin' ? '/admin' : '/')
    } catch (err) {
      addError(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Green Contact Bar skipped for brevity */}
      {/* ... previous code remains same ... */}
      <TopContactBar />

      <div className="bg-white border-b-4 border-schoolYellow py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <img
              src="/school-logo.jpg"
              alt="Green Park School Logo"
              className="h-20 md:h-28 object-contain"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-schoolGreen to-green-700 text-white p-6 text-center">
              <h2 className="text-2xl font-bold">Parent & Admin Portal</h2>
              <p className="text-green-100 text-sm mt-1">GreenPark School Information Access</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Login As:
                </label>
                <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRole('parent')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${role === 'parent'
                      ? 'bg-white text-schoolGreen shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${role === 'admin'
                      ? 'bg-white text-schoolGreen shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen outline-none transition duration-200"
                    placeholder="Enter phone number"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen outline-none transition duration-200"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-schoolGreen text-white py-3 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Login
                  </>
                )}
              </button>

              {/* Links Section */}
              <div className="mt-6 space-y-3">
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-schoolGreen hover:text-green-800 font-medium transition"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="text-schoolGreen hover:text-green-800 font-semibold transition"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </form>


          </div>
        </div>
      </div>
    </div>
  )
}
