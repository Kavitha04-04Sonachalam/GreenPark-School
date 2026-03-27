import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { Calendar, Save, Check, X, ChevronRight, UserCheck, UserX } from 'lucide-react'

export default function AdminAttendance() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [filters, setFilters] = useState({
    class_: '',
    section: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [attendanceData, setAttendanceData] = useState({}) // {student_id: 'present' | 'absent'}

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const sections = ['A', 'B', 'C', 'D']

  const fetchStudents = async () => {
    if (!filters.class_ || !filters.section) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Your session has expired. Please login again.')
        return
      }
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/students?class_name=${filters.class_}&section=${filters.section}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
        // Default all to present
        const initialAttendance = {}
        data.forEach(s => initialAttendance[s.student_id] = 'present')
        setAttendanceData(initialAttendance)
        setStep(2)
      } else if (response.status === 401) {
        alert('Unauthorized access. Please login again as an administrator.')
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Failed to fetch students'}`)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAttendance = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const payload = {
        date: filters.date,
        class: filters.class_,
        section: filters.section,
        attendance: students.map(s => ({
          student_id: s.student_id,
          status: attendanceData[s.student_id]
        }))
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/admin/attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert('Attendance recorded successfully!')
        setStep(1)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.detail || 'Failed to save attendance'}`)
      }
    } catch (error) {
      console.error('Failed to save attendance:', error)
      alert('Failed to connect to server')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = (id, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [id]: status
    }))
  }

  const markAll = (status) => {
    const newData = {}
    students.forEach(s => newData[s.student_id] = status)
    setAttendanceData(newData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-schoolGreen">Attendance Management</h1>
        <p className="text-gray-600">Mark student attendance dynamically from the database</p>
      </div>

      {step === 1 && (
        <Card className="max-w-md mx-auto">
          <h2 className="text-lg font-bold text-schoolGreen mb-6 flex items-center gap-2">
            <Calendar size={20} /> Select Class & Date
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Date</label>
              <input 
                type="date" 
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Class</label>
                <select 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 appearance-none"
                  value={filters.class_}
                  onChange={(e) => setFilters({...filters, class_: e.target.value})}
                >
                  <option value="">Select</option>
                  {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Section</label>
                <select 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 appearance-none"
                  value={filters.section}
                  onChange={(e) => setFilters({...filters, section: e.target.value})}
                >
                  <option value="">Select</option>
                  {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
            <button 
              disabled={!filters.class_ || !filters.section || loading}
              onClick={fetchStudents}
              className="w-full mt-4 bg-schoolGreen text-white py-3 rounded-lg font-bold hover:bg-opacity-90 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'Start Marking Attendance'} <ChevronRight size={20} />
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="animate-in slide-in-from-right duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="p-3 bg-schoolGreen/5 border border-schoolGreen/20 rounded-lg">
               <p className="text-sm text-schoolGreen">
                Marking for <span className="font-bold">Class {filters.class_}-{filters.section}</span> on <span className="font-bold">{filters.date}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => markAll('present')}
                className="px-4 py-2 bg-green-50 text-green-700 text-sm font-bold rounded-lg border border-green-200 hover:bg-green-100 transition flex items-center gap-2"
              >
                <UserCheck size={16} /> Mark All Present
              </button>
              <button 
                onClick={() => markAll('absent')}
                className="px-4 py-2 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-200 hover:bg-red-100 transition flex items-center gap-2"
              >
                <UserX size={16} /> Mark All Absent
              </button>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {student.roll_number || student.admission_number || student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{student.first_name} {student.last_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex p-1 bg-gray-100 rounded-lg">
                          <button
                            onClick={() => setStatus(student.student_id, 'present')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                              attendanceData[student.student_id] === 'present'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => setStatus(student.student_id, 'absent')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                              attendanceData[student.student_id] === 'absent'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                        No students found for this class and section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-bold text-gray-600">
                    Present: <span className="text-green-600">{Object.values(attendanceData).filter(v => v === 'present').length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-bold text-gray-600">
                    Absent: <span className="text-red-600">{Object.values(attendanceData).filter(v => v === 'absent').length}</span>
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  disabled={saving || students.length === 0}
                  onClick={handleSaveAttendance}
                  className="bg-schoolGreen text-white px-10 py-2.5 rounded-lg font-bold hover:bg-opacity-90 transition flex items-center gap-2 shadow-lg shadow-schoolGreen/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : <><Save size={20} /> Save Attendance</>}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
