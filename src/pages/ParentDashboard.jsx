import { useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { TrendingUp, AlertCircle, Calendar, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ParentDashboard() {
  const { selectedChild } = useSelectedChild()
  const { data, loading, fetchFees, fetchAttendance, fetchMarks, fetchAnnouncements, fetchEvents } = useData()

  useEffect(() => {
    if (selectedChild) {
      fetchFees(selectedChild.id)
      fetchAttendance(selectedChild.id)
      fetchMarks(selectedChild.id)
      fetchAnnouncements()
      fetchEvents()
    }
  }, [selectedChild])

  if (loading) return <LoadingSpinner />

  const pendingFees = data.fees.filter(f => f.status === 'Pending')
  const attendancePercentage = data.attendance.length > 0
    ? Math.round((data.attendance.filter(a => a.status === 'Present').length / data.attendance.length) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-schoolGreen to-green-600 text-white p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-green-100 text-lg">
          {selectedChild ? `${selectedChild.name} - ${selectedChild.class}` : 'Loading...'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fee Status Card */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Fee Status</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">{pendingFees.length}</p>
              <p className="text-xs text-gray-500 mt-1">Pending</p>
            </div>
            <AlertCircle className="text-schoolYellow" size={32} />
          </div>
          <Link
            to="/fees"
            className="mt-4 inline-block text-sm text-schoolGreen hover:underline font-medium"
          >
            View Fees →
          </Link>
        </Card>

        {/* Attendance Card */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Attendance</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">{attendancePercentage}%</p>
              <p className="text-xs text-gray-500 mt-1">Present</p>
            </div>
            <Calendar className="text-schoolYellow" size={32} />
          </div>
          <Link
            to="/attendance"
            className="mt-4 inline-block text-sm text-schoolGreen hover:underline font-medium"
          >
            View Details →
          </Link>
        </Card>

        {/* Marks Card */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Performance</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">
                {data.marks.length > 0
                  ? Math.round(
                      data.marks.reduce((sum, m) => sum + m.percentage, 0) / data.marks.length
                    )
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
            <TrendingUp className="text-schoolYellow" size={32} />
          </div>
          <Link
            to="/marks"
            className="mt-4 inline-block text-sm text-schoolGreen hover:underline font-medium"
          >
            View Marks →
          </Link>
        </Card>

        {/* Events Card */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Events</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">{data.events.length}</p>
              <p className="text-xs text-gray-500 mt-1">Upcoming</p>
            </div>
            <BookOpen className="text-schoolYellow" size={32} />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Announcements */}
        <Card>
          <h2 className="text-xl font-bold text-schoolGreen mb-4">Recent Announcements</h2>
          <div className="space-y-4">
            {data.announcements.slice(0, 3).map(announcement => (
              <div key={announcement.id} className="pb-4 border-b border-gray-200 last:border-0">
                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                <p className="text-xs text-gray-400 mt-2">{announcement.date}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <h2 className="text-xl font-bold text-schoolGreen mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {data.events.slice(0, 3).map(event => (
              <div key={event.id} className="pb-4 border-b border-gray-200 last:border-0">
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <p className="text-xs text-schoolGreen font-medium mt-2">📅 {event.date}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
