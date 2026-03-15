import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useError } from '../context/ErrorContext'
import { LogIn, Mail, Phone, MapPin, Facebook, Youtube, Linkedin, Instagram, Eye, EyeOff } from 'lucide-react'

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
      <div className="bg-contactGreen text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs md:text-sm gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <a href="mailto:greenparkmatricschool@gmail.com" className="flex items-center gap-1 hover:text-gray-200 transition">
              <Mail size={14} />
              <span className="hidden sm:inline">greenparkmatricschool@gmail.com</span>
            </a>
            <a href="tel:+919597588899" className="flex items-center gap-1 hover:text-gray-200 transition">
              <Phone size={14} />
              <span>+91 95975 88899 / 95293 22223 / 9500959693</span>
            </a>
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="hidden md:inline">No: 5, Sai Ram Nagar, Siruvachur, Perambalur - 621113</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/greenpark_siruvachur/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-200 transition"
              aria-label="Instagram"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://www.facebook.com/gpmhss/?locale=da_DK&_rdr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-200 transition"
              aria-label="Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href="https://www.youtube.com/@greenparkschoolsiruvachurp4612"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-200 transition"
              aria-label="YouTube"
            >
              <Youtube size={16} />
            </a>
            <a
              href="https://www.linkedin.com/in/swathika-muthaya-a32b46337/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-200 transition"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white border-b-4 border-schoolYellow py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <img
              src="/school-logo.jpg"
              alt="Green Park School Logo"
              className="h-24 md:h-28 object-contain"
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
                  <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
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
