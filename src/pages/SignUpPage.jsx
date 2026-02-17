import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useError } from '../context/ErrorContext'
import { UserPlus, Mail, Phone, MapPin, Facebook, Youtube, Linkedin, Instagram } from 'lucide-react'

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const { addError } = useError()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Validation
            if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
                throw new Error('Please fill in all fields')
            }

            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match')
            }

            if (formData.password.length < 6) {
                throw new Error('Password must be at least 6 characters')
            }

            // Phone validation (10-12 digits)
            const phoneRegex = /^\d{10,12}$/
            if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
                throw new Error('Phone number must be 10-12 digits')
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.(com|in|org)$/
            if (!emailRegex.test(formData.email)) {
                throw new Error('Email must end with .com, .in, or .org')
            }

            // Here you would normally make an API call to register the user
            // For now, we'll just show a success message and redirect to login
            alert('Registration successful! Please login with your credentials.')
            navigate('/login')
        } catch (err) {
            addError(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Green Contact Bar */}
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
                        <a href="#" className="hover:text-gray-200 transition" aria-label="Instagram">
                            <Instagram size={16} />
                        </a>
                        <a href="#" className="hover:text-gray-200 transition" aria-label="Facebook">
                            <Facebook size={16} />
                        </a>
                        <a href="#" className="hover:text-gray-200 transition" aria-label="YouTube">
                            <Youtube size={16} />
                        </a>
                        <a href="#" className="hover:text-gray-200 transition" aria-label="LinkedIn">
                            <Linkedin size={16} />
                        </a>
                    </div>
                </div>
            </div>

            {/* School Logo & Name Header */}
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

            {/* Sign Up Card Section */}
            <div className="flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Sign Up Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-schoolGreen to-green-700 text-white p-6 text-center">
                            <h2 className="text-2xl font-bold">Create Account</h2>
                            <p className="text-green-100 text-sm mt-1">Sign up for Parent Portal access</p>
                        </div>

                        {/* Sign Up Form */}
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="mb-5">
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
                                    placeholder="Enter your full name"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="mb-5">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
                                    placeholder="Enter your email"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="mb-5">
                                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
                                    placeholder="Enter 10-12 digit phone number"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="mb-5">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
                                    placeholder="Create a password (min 6 characters)"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="mb-6">
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
                                    placeholder="Confirm your password"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-schoolGreen text-white py-3 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={20} />
                                        Sign Up
                                    </>
                                )}
                            </button>

                            {/* Links Section */}
                            <div className="mt-6 text-center text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="text-schoolGreen hover:text-green-800 font-semibold transition"
                                >
                                    Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
