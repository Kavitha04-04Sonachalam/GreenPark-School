import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AdmissionEnquiryPage() {
  const [formData, setFormData] = useState({
    student_name: '',
    class_applied: '',
    parent_name: '',
    phone: '',
    message: ''
  })
  
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })

    if (!formData.student_name || !formData.class_applied || !formData.parent_name || !formData.phone) {
      setStatus({ type: 'error', message: 'Please fill all required fields' })
      return
    }

    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      setStatus({ type: 'error', message: 'Phone number must be exactly 10 digits and start with 6-9' })
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/api/v1/admission-enquiry`, formData)
      setStatus({ type: 'success', message: 'Your enquiry has been submitted successfully' })
      setFormData({
        student_name: '',
        class_applied: '',
        parent_name: '',
        phone: '',
        message: ''
      })
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'An error occurred. Please try again.'
      setStatus({ type: 'error', message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header isAdmin={false} />
      
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 pt-40 md:pt-48 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg w-full overflow-hidden border border-gray-100">
          <div className="bg-schoolGreen px-6 py-6 border-b border-gray-200 text-center">
            <h1 className="text-2xl font-bold text-white">Admission Enquiry</h1>
            <p className="text-green-50 mt-2">Fill out the form below to enquire about admissions</p>
          </div>
          
          <div className="p-6 md:p-8">
            {status.message && (
              <div className={`p-4 rounded-lg mb-6 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    name="student_name"
                    value={formData.student_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-schoolGreen focus:border-schoolGreen outline-none transition"
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Applying For *</label>
                  <select
                    name="class_applied"
                    value={formData.class_applied}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-schoolGreen focus:border-schoolGreen outline-none transition"
                  >
                    <option value="" disabled>Select a class</option>
                    <option value="Pre-KG">Pre-KG</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                  <input
                    type="text"
                    name="parent_name"
                    value={formData.parent_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-schoolGreen focus:border-schoolGreen outline-none transition"
                    placeholder="Enter parent name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    pattern="^[6-9]\d{9}$"
                    title="Please enter a valid 10-digit Indian mobile number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-schoolGreen focus:border-schoolGreen outline-none transition"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-schoolGreen focus:border-schoolGreen outline-none transition resize-y"
                  placeholder="Any specific questions or requirements?"
                ></textarea>
              </div>

              <div className="pt-2 flex flex-col md:flex-row gap-4 items-center justify-between">
                <Link to="/login" className="text-sm text-schoolGreen hover:underline">
                  Already a parent? Login here
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full md:w-auto px-6 py-2.5 bg-schoolYellow hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg shadow transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
