import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Bell, Lock, Shield, Eye, EyeOff, Smartphone, Globe, Settings, CreditCard, User, History } from 'lucide-react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'

export default function SettingsPage() {
    const { user } = useAuth()
    const { tab } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    
    // Determine active tab from URL or state
    const currentPath = location.pathname
    let tabFromUrl = 'notifications'
    if (currentPath.includes('/privacy')) tabFromUrl = 'privacy'
    else if (currentPath.includes('/language')) tabFromUrl = 'language'
    else if (currentPath.includes('/password')) tabFromUrl = 'password'
    
    const [activeTab, setActiveTab] = useState(tabFromUrl)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Password States
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswords, setShowPasswords] = useState(false)

    const [notifications, setNotifications] = useState({
        sms: false,
        push: true,
        attendance: true,
        marks: true,
        fees: true
    })

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' })
            return
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
            return
        }

        setIsLoading(true)
        try {
            const phoneNumber = user?.phone_number

            if (!phoneNumber) {
                throw new Error('User phone number not found. Please log in again.')
            }

            const response = await fetch('http://localhost:8000/api/v1/change-password', {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    current_password: currentPassword,
                    new_password: newPassword
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to change password')
            }

            setMessage({ type: 'success', text: 'Password changed successfully!' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setIsLoading(false)
        }
    }

    const tabs = [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'password', label: 'Password', icon: Lock },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'language', label: 'Language', icon: Globe },
    ]

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-schoolGreen mb-2">Settings</h1>
                <p className="text-gray-600">Configure your portal preferences and security</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation Sidebar */}
                <div className="md:col-span-1 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    const base = location.pathname.includes('/admin') ? '/admin/settings' : '/settings'
                                    navigate(tab.id === 'notifications' ? base : `${base}/${tab.id}`)
                                    setActiveTab(tab.id)
                                    setMessage({ type: '', text: '' })
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition text-left ${activeTab === tab.id
                                    ? 'bg-schoolGreen text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <Card highlight>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 text-schoolGreen rounded-lg">
                                        <Bell size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Communication Channels</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">SMS Alerts</p>
                                                    <p className="text-sm text-gray-500">Get critical updates on your phone</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={notifications.sms} onChange={() => toggleNotification('sms')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-schoolGreen"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Portal Alerts</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900">Attendance Updates</p>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={notifications.attendance} onChange={() => toggleNotification('attendance')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-schoolGreen"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900">Marks & Results</p>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={notifications.marks} onChange={() => toggleNotification('marks')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-schoolGreen"></div>
                                                </label>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900">Fee Deadlines</p>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={notifications.fees} onChange={() => toggleNotification('fees')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-schoolGreen"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card highlight>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-yellow-100 text-orange-600 rounded-lg">
                                        <Smartphone size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                                <Smartphone size={18} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Chrome on Windows</p>
                                                <p className="text-xs text-gray-500">Last active: Just now • Perambalur, TN</p>
                                            </div>
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Current</span>
                                    </div>
                                    <Button variant="secondary" size="sm" className="w-full text-xs">Log out of all other sessions</Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <Card highlight>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                    <Lock size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen outline-none"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen outline-none"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-schoolGreen outline-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
                                >
                                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                    {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
                                </button>

                                <div className="pt-4">
                                    <Button variant="primary" className="w-full" disabled={isLoading}>
                                        {isLoading ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'privacy' && (
                        <Card highlight>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Shield size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Privacy & Security</h2>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-900">Public Profile</p>
                                        <p className="text-sm text-gray-500">Allow other parents to see your name</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-schoolGreen"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                                        <p className="text-sm text-gray-500">Secure your account with SMS verification</p>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Coming Soon</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'language' && (
                        <Card highlight>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Globe size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Language & Region</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Language</label>
                                    <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition-all">
                                        <option value="en">English (UK)</option>
                                        <option value="ta">Tamil (தமிழ்)</option>
                                        <option value="hi">Hindi (हिन्दी)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                                    <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition-all">
                                        <option value="IST">(GMT+05:30) India Standard Time</option>
                                    </select>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
