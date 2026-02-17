import { useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { Calendar, TrendingUp } from 'lucide-react'

export default function AttendancePage() {
  const { selectedChild } = useSelectedChild()
  const { data, loading, fetchAttendance } = useData()

  useEffect(() => {
    if (selectedChild) {
      fetchAttendance(selectedChild.id)
    }
  }, [selectedChild])

  if (loading) return <LoadingSpinner />

  const presentDays = data.attendance.filter(a => a.status === 'Present').length
  const totalDays = data.attendance.length
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">Attendance Record</h1>
        <p className="text-gray-600">{selectedChild?.name} - {selectedChild?.class}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Attendance Rate</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">{percentage}%</p>
            </div>
            <TrendingUp className="text-schoolYellow" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Present Days</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{presentDays}</p>
            </div>
            <Calendar className="text-green-500" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Absent Days</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{totalDays - presentDays}</p>
            </div>
            <Calendar className="text-red-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Attendance Calendar */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Daily Attendance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.attendance.map(record => (
                <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{record.date}</td>
                  <td className="py-3 px-4">{record.subject}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'Present'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Attendance Info */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-4">Information</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-schoolGreen font-bold mt-0.5">•</span>
            <span>Regular attendance is important for academic success.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-schoolGreen font-bold mt-0.5">•</span>
            <span>75% minimum attendance is required as per school policy.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-schoolGreen font-bold mt-0.5">•</span>
            <span>All absences must be reported to the school.</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
