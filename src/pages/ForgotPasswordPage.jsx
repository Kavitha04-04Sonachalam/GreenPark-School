import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useError } from '../context/ErrorContext'
import { Mail, Phone, MapPin, Facebook, Youtube, Linkedin, Instagram, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const { addError } = useError()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (!email) {
                throw new Error('Please enter your email address')
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.(com|in|org)$/
            if (!emailRegex.test(email)) {
                throw new Error('Please enter a valid email address')
            }

            // Here you would normally make an API call to send reset email
            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            setIsSubmitted(true)
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

            {/* Forgot Password Card Section */}
            <div className="flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Forgot Password Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-schoolGreen to-green-700 text-white p-6 text-center">
                            <h2 className="text-2xl font-bold">Forgot Password?</h2>
                            <p className="text-green-100 text-sm mt-1">We'll send you a reset link</p>
                        </div>

                        {/* Form Content */}
                        <div className="p-8">
                            {!isSubmitted ? (
                                <form onSubmit={handleSubmit}>
                                    <p className="text-gray-600 text-sm mb-6">
                                        Enter your email address and we'll send you instructions to reset your password.
                                    </p>

                                    <div className="mb-6">
                                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen focus:border-transparent outline-none transition duration-200"
                                            placeholder="Enter your email"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-schoolGreen text-white py-3 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="animate-spin">⏳</span>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Reset Link
                                            </>
                                        )}
                                    </button>

                                    <Link
                                        to="/login"
                                        className="flex items-center justify-center gap-2 text-sm text-schoolGreen hover:text-green-800 font-medium transition"
                                    >
                                        <ArrowLeft size={16} />
                                        Back to Login
                                    </Link>
                                </form>
                            ) : (
                                <div className="text-center">
                                    <div className="mb-4 text-green-600">
                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Check Your Email</h3>
                                    <p className="text-gray-600 text-sm mb-6">
                                        We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
                                    </p>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-schoolGreen hover:text-green-800 font-medium transition"
                                    >
                                        <ArrowLeft size={16} />
                                        Back to Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
