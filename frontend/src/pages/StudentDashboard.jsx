import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { TrendingUp, Calendar, BookOpen, Megaphone, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data, loading, fetchMarks, fetchNotifications, fetchEvents } = useData()

  useEffect(() => {
    if (user && user.student_id) {
      fetchMarks(user.student_id)
      if (user.class_name) {
        fetchNotifications(user.class_name)
      } else {
        fetchNotifications()
      }
      fetchEvents()
    }
  }, [user])

  if (loading) return <LoadingSpinner />

  // Calculate average performance
  const marks = data.marks || []
  const averagePercentage = marks.length > 0
    ? Math.round(marks.reduce((sum, m) => sum + m.percentage, 0) / marks.length)
    : 0

  const notifications = data.notifications || []
  const events = data.events || []

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-schoolGreen to-green-600 text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>
        
        <h1 className="text-3xl font-black mb-2">Welcome Back, {user?.name}!</h1>
        <p className="text-green-100 text-lg font-medium">
          Class: <span className="text-yellow-300 font-bold">{user?.class_name || 'Loading...'}</span> 
          {user?.admission_number && ` | Admission No: ${user.admission_number}`}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Performance Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Academic Average</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">{averagePercentage}%</p>
              <p className="text-xs text-gray-500 mt-1">Based on recent exams</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-schoolGreen">
              <TrendingUp size={24} />
            </div>
          </div>
          <Link
            to="/student/marks"
            className="mt-4 inline-block text-sm font-semibold text-schoolGreen hover:underline transition"
          >
            View Report Card →
          </Link>
        </Card>

        {/* Notices Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Class Notices</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">{notifications.length}</p>
              <p className="text-xs text-gray-500 mt-1">New updates targeting your class</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl text-schoolYellow">
              <Megaphone size={24} />
            </div>
          </div>
          <Link
            to="/student/announcements"
            className="mt-4 inline-block text-sm font-semibold text-schoolGreen hover:underline transition"
          >
            View Announcements →
          </Link>
        </Card>

        {/* Upcoming Events Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">School Events</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">{events.length}</p>
              <p className="text-xs text-gray-500 mt-1">Activities and schedules</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-schoolGreen">
              <Calendar size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400 font-medium">
            Stay active & participate
          </div>
        </Card>
      </div>

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Announcements */}
        <Card highlight>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-schoolGreen flex items-center gap-2">
              <Bell size={20} /> Latest Announcements
            </h2>
            <Link 
              to="/student/announcements" 
              className="text-xs font-semibold text-schoolGreen hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 italic text-center">No announcements available.</p>
            ) : (
              notifications.slice(0, 3).map(notif => (
                <div key={notif.id} className="pb-4 border-b border-gray-150 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{notif.title}</h3>
                    <span className="text-[10px] bg-green-50 text-schoolGreen px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                      {notif.target_type === 'all' ? 'School-wide' : 'Class'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-650 mt-1.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">
                    Posted: {new Date(notif.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card highlight>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-schoolGreen flex items-center gap-2">
              <Calendar size={20} /> Upcoming Events
            </h2>
          </div>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 italic text-center">No upcoming events listed.</p>
            ) : (
              events.slice(0, 3).map(event => (
                <div key={event.id} className="pb-4 border-b border-gray-150 last:border-0 last:pb-0">
                  <h3 className="font-bold text-gray-900 text-base">{event.title}</h3>
                  <p className="text-sm text-gray-650 mt-1 line-clamp-2 leading-relaxed">{event.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-schoolGreen bg-green-50 px-2.5 py-1 rounded-lg font-bold">
                      📅 {event.date || 'TBD'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
