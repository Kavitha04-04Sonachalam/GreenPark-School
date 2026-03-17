import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { Users, BookOpen, Layers, Zap, Bell, Calendar, TrendingUp, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    total_students: 0,
    total_parents: 0,
    total_classes: 0,
    total_activities: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/api/v1/admin/dashboard-summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setSummary(data)
        }
      } catch (error) {
        console.error('Failed to fetch summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  const stats = [
    { label: 'Total Students', value: summary.total_students, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', link: '/admin/students' },
    { label: 'Total Parents', value: summary.total_parents, icon: Users, color: 'text-green-600', bg: 'bg-green-100', link: '/admin/parents' },
    { label: 'Total Classes', value: summary.total_classes, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-100', link: '/admin/classes' },
    { label: 'Activities', value: summary.total_activities, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100', link: '/admin/activities' }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">School Overview</h1>
        <p className="text-gray-600">Welcome back, Administrator. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-1">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Link key={idx} to={stat.link}>
              <Card className="hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-t-4 border-schoolGreen shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={stat.color} size={28} />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-schoolGreen flex items-center gap-2">
            <TrendingUp size={20} /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <Link to="/admin/students">
              <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-schoolYellow/20 hover:border-schoolYellow transition group">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-white transition">
                  <UserPlus size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Add Student</p>
                  <p className="text-xs text-gray-500">Register a new student</p>
                </div>
              </button>
            </Link>
            <Link to="/admin/attendance">
              <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-green-50 hover:border-green-200 transition group">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-white transition">
                  <Calendar size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Daily Attendance</p>
                  <p className="text-xs text-gray-500">Mark student attendance</p>
                </div>
              </button>
            </Link>
            <Link to="/admin/marks">
              <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition group">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-white transition">
                  <BookOpen size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Enter Marks</p>
                  <p className="text-xs text-gray-500">Upload exam percentages</p>
                </div>
              </button>
            </Link>
            <Link to="/admin/announcements">
              <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-yellow-50 hover:border-yellow-200 transition group">
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-white transition">
                  <Bell size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Post Notice</p>
                  <p className="text-xs text-gray-500">Share announcements</p>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* System Logs / Recent Updates placeholder */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-schoolGreen mb-4">Recent Updates</h2>
          <Card>
            <div className="divide-y divide-gray-100">
              <div className="py-4 first:pt-0">
                <div className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Academic session for 2024-25 is live.</p>
                    <p className="text-xs text-gray-500 mt-1">System • Today, 10:00 AM</p>
                  </div>
                </div>
              </div>
              <div className="py-4">
                <div className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data backup completed successfully.</p>
                    <p className="text-xs text-gray-500 mt-1">Server • Yesterday, 11:30 PM</p>
                  </div>
                </div>
              </div>
              <div className="py-4 last:pb-0">
                <div className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fee reminders sent to 45 pending users.</p>
                    <p className="text-xs text-gray-500 mt-1">Finance • 2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
