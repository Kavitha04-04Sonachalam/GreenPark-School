import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Bell, Lock, Shield, Eye, EyeOff, Smartphone, Globe } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('notifications')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Password States
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswords, setShowPasswords] = useState(false)

    const [notifications, setNotifications] = useState({
        email: true,
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
                            <Card>
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
                                                    <p className="font-medium text-gray-900">Email Notifications</p>
                                                    <p className="text-sm text-gray-500">Receive updates via your registered email</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={notifications.email} onChange={() => toggleNotification('email')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-schoolGreen"></div>
                                                </label>
                                            </div>
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

                            <Card>
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
                        <Card>
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

                    {(activeTab === 'privacy' || activeTab === 'language') && (
                        <Card>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="p-4 bg-gray-100 rounded-full mb-4">
                                    <Settings className="text-gray-400" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 capitalize">{activeTab} Settings</h2>
                                <p className="text-gray-500 mt-2 max-w-sm">
                                    These settings are managed by the school administrator or will be available in the next update.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
