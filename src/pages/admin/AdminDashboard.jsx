import Card from '../../components/common/Card'
import { Users, DollarSign, BookOpen, Bell } from 'lucide-react'

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Parents', value: '245', icon: Users, color: 'schoolGreen' },
    { label: 'Total Students', value: '1,240', icon: BookOpen, color: 'schoolGreen' },
    { label: 'Pending Fees', value: '₹45,000', icon: DollarSign, color: 'schoolGreen' },
    { label: 'Announcements', value: '12', icon: Bell, color: 'schoolGreen' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage school operations and resources</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-schoolGreen mt-2">{stat.value}</p>
                </div>
                <Icon className="text-schoolYellow" size={32} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Activities */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Recent Activities</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-schoolYellow rounded-full flex items-center justify-center text-schoolGreen font-bold">
              ✓
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Fee payment received</p>
              <p className="text-sm text-gray-600">Aditya (Class 10A) - ₹5000</p>
              <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              📋
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">New announcement posted</p>
              <p className="text-sm text-gray-600">Annual Sports Day - 15th March</p>
              <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              👤
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">New parent registered</p>
              <p className="text-sm text-gray-600">Mr. Sharma - Ananya (Class 9B)</p>
              <p className="text-xs text-gray-500 mt-1">1 day ago</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card clickable>
          <h3 className="text-lg font-bold text-schoolGreen mb-2">Manage Users</h3>
          <p className="text-gray-600 text-sm">Add, edit, or remove parents and students</p>
        </Card>
        <Card clickable>
          <h3 className="text-lg font-bold text-schoolGreen mb-2">Post Announcement</h3>
          <p className="text-gray-600 text-sm">Create and send announcements to parents</p>
        </Card>
        <Card clickable>
          <h3 className="text-lg font-bold text-schoolGreen mb-2">Fee Management</h3>
          <p className="text-gray-600 text-sm">Track and manage student fees</p>
        </Card>
        <Card clickable>
          <h3 className="text-lg font-bold text-schoolGreen mb-2">Reports</h3>
          <p className="text-gray-600 text-sm">View attendance, marks, and financial reports</p>
        </Card>
      </div>
    </div>
  )
}
