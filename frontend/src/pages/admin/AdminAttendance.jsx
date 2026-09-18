import { API_BASE_URL } from '@/config'
import { useState } from 'react'
import Card from '../../components/common/Card'
import { Calendar, Save, CheckCircle2, AlertCircle, Users, Check, X, RefreshCw } from 'lucide-react'

export default function AdminAttendance() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [filters, setFilters] = useState({
    class_: '7',
    section: 'A',
    date: new Date().toISOString().split('T')[0]
  })
  const [attendanceData, setAttendanceData] = useState({}) // {student_id: 'Present' | 'Absent'}
  const [message, setMessage] = useState(null)

  const classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const sections = ['A', 'B', 'C', 'D']

  const fetchAttendanceRoster = async () => {
    if (!filters.class_ || !filters.section || !filters.date) {
      alert('Please select Class, Section, and Date.')
      return
    }
    try {
      setLoading(true)
      setMessage(null)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/attendance?class_name=${filters.class_}&section=${filters.section}&date=${filters.date}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
        const initialStatus = {}
        data.forEach((s) => {
          initialStatus[s.student_id] = s.status || 'Present'
        })
        setAttendanceData(initialStatus)
        setStep(2)
      } else {
        alert('Failed to load students for the selected class.')
      }
    } catch (error) {
      console.error('Failed to load roster:', error)
      alert('Network or server connection error.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleMarkAll = (status) => {
    const updated = {}
    students.forEach((s) => {
      updated[s.student_id] = status
    })
    setAttendanceData(updated)
  }

  const handleSaveAttendance = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const token = localStorage.getItem('token')

      const attendanceList = Object.entries(attendanceData).map(([student_id, status]) => ({
        student_id,
        status
      }))

      const payload = {
        class: filters.class_,
        section: filters.section,
        date: filters.date,
        attendance: attendanceList
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/admin/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Attendance recorded successfully for Class ${filters.class_}-${filters.section} on ${filters.date}!`
        })
      } else {
        const err = await response.json()
        setMessage({
          type: 'error',
          text: err.detail || 'Failed to save attendance.'
        })
      }
    } catch (error) {
      console.error('Save attendance error:', error)
      setMessage({ type: 'error', text: 'Network error while saving attendance.' })
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendanceData).filter((s) => s === 'Present').length
  const absentCount = Object.values(attendanceData).filter((s) => s === 'Absent').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-schoolGreen flex items-center gap-2">
            <Calendar className="text-schoolYellow" size={28} />
            Daily Attendance Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Record, update, and track class attendance offline or on LAN.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-schoolGreen"
              value={filters.class_}
              onChange={(e) => setFilters({ ...filters, class_: e.target.value })}
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-schoolGreen"
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-schoolGreen"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>

          <div>
            <button
              onClick={fetchAttendanceRoster}
              disabled={loading}
              className="w-full bg-schoolGreen hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:bg-gray-400"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Users size={16} />}
              {loading ? 'Loading...' : 'Load Students'}
            </button>
          </div>
        </div>
      </Card>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Roster & Attendance Marking */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary & Quick Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-gray-700">
                Class {filters.class_}-{filters.section} ({filters.date})
              </span>
              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                {students.length} Students
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Check size={12} /> {presentCount} Present
              </span>
              <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <X size={12} /> {absentCount} Absent
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                className="ml-auto md:ml-0 bg-schoolGreen hover:bg-emerald-800 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:bg-gray-400"
              >
                {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {students.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No students found in Class {filters.class_}-{filters.section}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-semibold">Roll No</th>
                      <th className="py-3.5 px-4 font-semibold">Student Name</th>
                      <th className="py-3.5 px-4 font-semibold">Student ID</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      const currentStatus = attendanceData[student.student_id] || 'Present'
                      return (
                        <tr
                          key={student.student_id}
                          className="hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {student.roll_number || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-800">
                            {student.name}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                            {student.student_id}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.student_id, 'Present')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  currentStatus === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-emerald-700'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.student_id, 'Absent')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  currentStatus === 'Absent'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-red-700'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
