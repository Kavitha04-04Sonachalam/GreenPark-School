import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Mail, Phone, MapPin, Edit2 } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+91 98765 43210',
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

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {/* Profile Picture & Basic Info */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-schoolGreen text-white rounded-full flex items-center justify-center text-3xl font-bold">
              {user?.name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 text-schoolGreen hover:text-green-700 font-medium"
          >
            <Edit2 size={16} />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
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
        <Card>
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
      <Card>
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
