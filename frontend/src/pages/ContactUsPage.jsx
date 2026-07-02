import { useState } from 'react'
import Card from '../components/common/Card'
import { MapPin, Phone, Mail, Send, CheckCircle2, MessageSquare } from 'lucide-react'
import api from '@/config/api'
import { useAuth } from '../context/AuthContext'
import { useSelectedChild } from '../context/SelectedChildContext'

export default function ContactUsPage() {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.subject || !formData.message) return
    
    setLoading(true)
    setError(null)
    try {
      let studentName = 'N/A'
      let classApplied = 'Contact Query'
      let parentName = user?.name || 'User'
      
      if (user?.role === 'parent') {
        studentName = selectedChild?.name || 'N/A'
        classApplied = selectedChild?.class || 'Parent'
      } else if (user?.role === 'student') {
        studentName = user.name
        classApplied = user.class_name || 'Student'
      } else if (user?.role === 'staff') {
        studentName = 'Staff member'
        classApplied = user.department || 'Staff'
      }

      // Ensure phone is exactly 10 digits and starts with 6-9
      let rawPhone = user?.phone_number || user?.phone || '9999999999'
      let cleanedPhone = rawPhone.replace(/\D/g, '')
      if (cleanedPhone.length > 10) {
        cleanedPhone = cleanedPhone.substring(cleanedPhone.length - 10)
      } else if (cleanedPhone.length < 10) {
        cleanedPhone = cleanedPhone.padStart(10, '9')
      }
      if (!/^[6-9]/.test(cleanedPhone)) {
        cleanedPhone = '9' + cleanedPhone.substring(1)
      }

      await api.post('/api/v1/admission-enquiry', {
        student_name: studentName,
        class_applied: classApplied,
        parent_name: parentName,
        phone: cleanedPhone,
        message: `Subject: ${formData.subject}\n\nMessage: ${formData.message}`
      })
      
      setSubmitted(true)
      setFormData({ subject: '', message: '' })
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-schoolGreen mb-2">Contact Us</h1>
        <p className="text-gray-600 font-medium">
          Get in touch with the school administration for any queries or support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-6 lg:col-span-1">
          <Card highlight className="flex gap-4 items-start">
            <div className="p-3 bg-green-50 text-schoolGreen rounded-xl shrink-0">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Phone Number</h3>
              <p className="text-sm text-gray-650 font-medium">+91 95975 88889</p>
              <p className="text-xs text-gray-400 mt-1">Mon - Sat: 9:00 AM - 5:00 PM</p>
            </div>
          </Card>

          <Card highlight className="flex gap-4 items-start">
            <div className="p-3 bg-yellow-50 text-schoolYellow rounded-xl shrink-0">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Email Address</h3>
              <p className="text-sm text-gray-650 font-medium break-all">
                greenparkmhssiruvachur@gmail.com
              </p>
              <p className="text-xs text-gray-400 mt-1">Typically replies within 24 hours</p>
            </div>
          </Card>

          <Card highlight className="flex gap-4 items-start">
            <div className="p-3 bg-green-50 text-schoolGreen rounded-xl shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Campus Location</h3>
              <p className="text-sm text-gray-650 leading-relaxed font-medium">
                No: 9, Sai Ram Nagar, Siruvachur, Perambalur – 621113
              </p>
              <p className="text-xs text-gray-400 mt-1">Tamil Nadu, India</p>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <h2 className="text-xl font-bold text-schoolGreen mb-6 flex items-center gap-2">
              <MessageSquare className="text-schoolYellow" size={22} /> Send a Message
            </h2>

            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 py-12">
                <CheckCircle2 className="text-green-500 animate-bounce" size={48} />
                <h3 className="text-lg font-bold">Message Sent Successfully!</h3>
                <p className="text-sm text-green-600 max-w-sm">
                  Thank you for contacting us. Our administration team will review your message and reach out to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 px-6 py-2 bg-schoolGreen text-white font-bold rounded-xl text-sm hover:bg-opacity-95 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter the subject of your query..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Describe your request or query in detail..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-schoolGreen/20 resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.subject || !formData.message}
                  className="w-full sm:w-auto px-6 py-3 bg-schoolGreen hover:bg-opacity-95 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
