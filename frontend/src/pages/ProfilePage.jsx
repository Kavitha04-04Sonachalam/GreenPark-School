import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Mail, Phone, MapPin, Edit2, Camera, Loader2 } from 'lucide-react'
import api from '@/config/api'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || user?.phone_number || '',
    address: user?.address || 'Perambalur, Tamil Nadu'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // In production, save to backend
    setIsEditing(false)
    alert('Profile updated successfully!')
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!user?.parent_id) {
      alert("Error: Parent ID not found. Please re-login.")
      return
    }

    try {
      setUploading(true)
      const uploadFormData = new FormData()
      uploadFormData.append('parent_id', user.parent_id)
      uploadFormData.append('image', file)

      const response = await api.post('/api/v1/profile/upload-photo', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        updateUser({ profile_image_url: response.data.profile_image_url })
        alert('Profile photo updated!')
      }
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert(error.response?.data?.detail || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {/* Profile Picture & Basic Info */}
      <Card highlight>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-schoolGreen text-white rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden shadow-lg border-4 border-white">
                {user?.profile_image_url ? (
                  <img 
                    src={user.profile_image_url} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name ? user.name[0].toUpperCase() : '?'
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={32} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-schoolYellow text-schoolGreen rounded-full shadow-md hover:scale-110 transition-transform disabled:opacity-50"
                title="Change Photo"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600 capitalize">{user?.role}</p>
              <p className="text-sm text-gray-400 mt-1">ID: {user?.parent_id || user?.id}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 text-schoolGreen hover:text-green-700 font-medium bg-green-50 px-4 py-2 rounded-lg transition"
          >
            <Edit2 size={16} />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </Card>

      {/* Contact Information */}
      <Card highlight>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Contact Information</h2>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen outline-none"
                rows="3"
              />
            </div>
            <Button variant="primary" onClick={handleSave}>Save Changes</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-schoolGreen" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{formData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-schoolGreen" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{formData.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-schoolGreen" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium text-gray-900">{formData.address}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Children Information */}
      {user?.children && user.children.length > 0 && (
        <Card highlight>
          <h2 className="text-xl font-bold text-schoolGreen mb-6">My Children</h2>
          <div className="space-y-4">
            {user.children.map(child => (
              <div key={child.id} className="pb-4 border-b border-gray-200 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-600">{child.class}</p>
                  </div>
                  <span className="text-xs bg-schoolYellow text-schoolGreen px-3 py-1 rounded-full font-medium">
                    Roll No: {child.rollNo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Security Settings */}
      <Card highlight>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Security</h2>
        <div className="space-y-4">
          <Button variant="outline" className="w-full">
            Change Password
          </Button>
          <Button variant="outline" className="w-full">
            Two-Factor Authentication
          </Button>
        </div>
      </Card>
    </div>
  )
}
