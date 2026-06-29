import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { 
  Users, 
  CalendarCheck, 
  Megaphone, 
  PlusCircle, 
  GraduationCap, 
  FileText 
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StaffDashboard() {
  const { user } = useAuth()
  const { data, loading, fetchNotifications, fetchEvents } = useData()

  useEffect(() => {
    fetchNotifications()
    fetchEvents()
  }, [])

  if (loading) return <LoadingSpinner />

  const notifications = data.notifications || []

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-schoolGreen to-green-600 text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>
        
        <h1 className="text-3xl font-black mb-2">Welcome Back, {user?.name}!</h1>
        <p className="text-green-100 text-lg font-medium">
          Department: <span className="text-yellow-300 font-bold">{user?.department || 'General Academics'}</span>
        </p>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Students Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Students Enrolled</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">19</p>
              <p className="text-xs text-gray-500 mt-1">Assigned classes</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-schoolGreen">
              <Users size={24} />
            </div>
          </div>
          <Link
            to="/staff/students"
            className="mt-4 inline-block text-sm font-semibold text-schoolGreen hover:underline transition"
          >
            View Student Roster →
          </Link>
        </Card>

        {/* Attendance Checked Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Today's Attendance</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">95%</p>
              <p className="text-xs text-gray-500 mt-1">Completed for 5th Standard</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl text-schoolYellow">
              <CalendarCheck size={24} />
            </div>
          </div>
          <Link
            to="/staff/attendance"
            className="mt-4 inline-block text-sm font-semibold text-schoolGreen hover:underline transition"
          >
            Manage Attendance →
          </Link>
        </Card>

        {/* Notices Sent Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Notices Published</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">{notifications.length}</p>
              <p className="text-xs text-gray-500 mt-1">Active announcements</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-schoolGreen">
              <Megaphone size={24} />
            </div>
          </div>
          <Link
            to="/staff/announcements"
            className="mt-4 inline-block text-sm font-semibold text-schoolGreen hover:underline transition"
          >
            Post Announcements →
          </Link>
        </Card>
      </div>

      {/* Staff Shortcuts Section */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6 flex items-center gap-2">
          <PlusCircle size={20} className="text-schoolYellow" /> Quick Shortcuts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link 
            to="/staff/attendance"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-schoolGreen hover:bg-green-50/20 group transition-all"
          >
            <CalendarCheck size={36} className="text-gray-400 group-hover:text-schoolGreen mb-3 transition" />
            <span className="font-bold text-gray-800 group-hover:text-schoolGreen transition">Mark Attendance</span>
            <span className="text-xs text-gray-400 mt-1 text-center">Track present & absent records</span>
          </Link>

          <Link 
            to="/staff/students"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-schoolGreen hover:bg-green-50/20 group transition-all"
          >
            <GraduationCap size={36} className="text-gray-400 group-hover:text-schoolGreen mb-3 transition" />
            <span className="font-bold text-gray-800 group-hover:text-schoolGreen transition">Enter Term Marks</span>
            <span className="text-xs text-gray-400 mt-1 text-center">Grade student examinations</span>
          </Link>

          <Link 
            to="/staff/announcements"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-schoolGreen hover:bg-green-50/20 group transition-all"
          >
            <Megaphone size={36} className="text-gray-400 group-hover:text-schoolGreen mb-3 transition" />
            <span className="font-bold text-gray-800 group-hover:text-schoolGreen transition">Publish Announcement</span>
            <span className="text-xs text-gray-400 mt-1 text-center">Broadcast messages to classes</span>
          </Link>
        </div>
      </Card>

      {/* Recent Activity Logs */}
      <div className="grid grid-cols-1 gap-6">
        <Card highlight>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-schoolGreen flex items-center gap-2">
              <FileText size={20} /> Active Notices & Announcements
            </h2>
            <Link to="/staff/announcements" className="text-xs font-semibold text-schoolGreen hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {notifications.slice(0, 3).map(notif => (
              <div key={notif.id} className="pb-4 border-b border-gray-150 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-base">{notif.title}</h3>
                  <span className="text-[10px] bg-green-50 text-schoolGreen px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                    Class {notif.class_name || 'All'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-gray-450 mt-2">
                  Created: {new Date(notif.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
