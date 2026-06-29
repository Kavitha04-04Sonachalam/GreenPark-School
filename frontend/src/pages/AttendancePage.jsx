import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function AttendancePage() {
  const { user } = useAuth()
  const { selectedChild } = useSelectedChild()
  const { data, loading, fetchAttendance } = useData()

  const studentId = user.role === 'student' ? user.student_id : selectedChild?.id
  const studentName = user.role === 'student' ? user.name : selectedChild?.name
  const studentClass = user.role === 'student' ? user.class_name : selectedChild?.class

  useEffect(() => {
    if (studentId) {
      fetchAttendance(studentId)
    }
  }, [studentId])

  if (loading) return <LoadingSpinner />

  const attendanceRecords = data.attendance || []
  
  // Calculate attendance metrics
  const totalDays = attendanceRecords.length
  const presentDays = attendanceRecords.filter(r => r.status?.toLowerCase() === 'present').length
  const absentDays = attendanceRecords.filter(r => r.status?.toLowerCase() === 'absent').length
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">Attendance History</h1>
        <p className="text-gray-600">
          Viewing attendance records for <span className="font-bold text-schoolGreen">{studentName}</span> ({studentClass})
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Attendance Percentage */}
        <Card highlight>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Attendance Rate</p>
              <p className={`text-3xl font-bold mt-2 ${
                attendancePercentage >= 90 ? 'text-green-600' : attendancePercentage >= 75 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {attendancePercentage}%
              </p>
            </div>
            <Calendar className="text-schoolYellow" size={32} />
          </div>
        </Card>

        {/* Present Days */}
        <Card highlight>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Days Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{presentDays}</p>
            </div>
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
        </Card>

        {/* Absent Days */}
        <Card highlight>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Days Absent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{absentDays}</p>
            </div>
            <XCircle className="text-red-500" size={32} />
          </div>
        </Card>

        {/* Total Working Days */}
        <Card highlight>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total School Days</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">{totalDays}</p>
            </div>
            <AlertCircle className="text-schoolGreen" size={32} />
          </div>
        </Card>
      </div>

      {/* Attendance Detail Table */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6 flex items-center gap-2">
          <Calendar size={20} /> Attendance Logs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Class & Section</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map(record => (
                  <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {new Date(record.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {record.class} - {record.section}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        record.status?.toLowerCase() === 'present'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {record.status?.toLowerCase() === 'present' ? (
                          <CheckCircle2 size={12} className="text-green-600" />
                        ) : (
                          <XCircle size={12} className="text-red-600" />
                        )}
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 italic">
                      {record.remarks || 'No remarks'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500 italic">
                    No attendance records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
