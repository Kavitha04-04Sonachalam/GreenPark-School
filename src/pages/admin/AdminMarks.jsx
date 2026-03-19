import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { BookOpen, Save, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminMarks() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [filters, setFilters] = useState({
    class_: '',
    section: '',
    exam: '',
    subject: ''
  })
  const [marksData, setMarksData] = useState({}) // {student_id: marks_value}

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const sections = ['A', 'B', 'C', 'D']
  const exams = ['First Mid Term', 'Quarterly', 'Second Mid Term', 'Half Yearly', 'Annual']
  const subjects = ['Tamil', 'English', 'Maths', 'Science', 'Social']

  const fetchStudents = async () => {
    if (!filters.class_ || !filters.section) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/v1/admin/students?class_name=${filters.class_}&section=${filters.section}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
        // Initialize marks data
        const initialMarks = {}
        data.forEach(s => initialMarks[s.student_id] = '')
        setMarksData(initialMarks)
        setStep(2)
      } else {
        alert('Failed to fetch students. Please try again.')
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
      alert('Connection error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMarks = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      
      const payload = {
        class: filters.class_,
        section: filters.section,
        exam_type: filters.exam,
        subject: filters.subject,
        marks: students.map(s => ({
          student_id: s.student_id,
          marks: parseFloat(marksData[s.student_id] || 0)
        }))
      }

      const response = await fetch('http://localhost:8000/api/v1/admin/marks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert('Marks saved successfully!')
        setStep(1)
        setMarksData({})
      } else {
        const err = await response.json()
        alert(`Error: ${err.detail || 'Failed to save marks'}`)
      }
    } catch (error) {
      console.error('Failed to save marks:', error)
      alert('Failed to connect to server.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-schoolGreen">Marks Entry System</h1>
        <p className="text-gray-600">Enter and update student performance across subjects dynamically</p>
      </div>

      {step === 1 && (
        <Card className="max-w-2xl mx-auto shadow-xl border-t-4 border-schoolYellow">
          <h2 className="text-lg font-bold text-schoolGreen mb-6 flex items-center gap-2">
            <BookOpen size={20} /> Select Class & Exam Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Class</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                value={filters.class_}
                onChange={(e) => setFilters({...filters, class_: e.target.value})}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Section</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                value={filters.section}
                onChange={(e) => setFilters({...filters, section: e.target.value})}
              >
                <option value="">Select Section</option>
                {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Exam Type</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                value={filters.exam}
                onChange={(e) => setFilters({...filters, exam: e.target.value})}
              >
                <option value="">Select Exam</option>
                {exams.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Subject</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                value={filters.subject}
                onChange={(e) => setFilters({...filters, subject: e.target.value})}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button 
            disabled={!filters.class_ || !filters.section || !filters.exam || !filters.subject || loading}
            onClick={fetchStudents}
            className="w-full mt-8 bg-schoolGreen text-white py-3 rounded-lg font-bold hover:bg-opacity-90 disabled:bg-gray-300 transition flex items-center justify-center gap-2 shadow-lg shadow-schoolGreen/20"
          >
            {loading ? 'Loading Students...' : 'Next: Enter Marks'} <ChevronRight size={20} />
          </button>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
          <div className="bg-schoolGreen/5 border border-schoolGreen/20 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
            <div className="flex flex-wrap gap-4 md:gap-8">
              <div className="text-sm">
                <span className="text-gray-500 uppercase text-[10px] font-bold block">Class & Section</span>
                <span className="font-bold text-schoolGreen">{filters.class_} - {filters.section}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 uppercase text-[10px] font-bold block">Subject</span>
                <span className="font-bold text-schoolGreen">{filters.subject}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 uppercase text-[10px] font-bold block">Exam Type</span>
                <span className="font-bold text-schoolGreen">{filters.exam}</span>
              </div>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="px-4 py-1.5 bg-white border border-schoolGreen/20 text-schoolGreen rounded-lg text-sm font-bold hover:bg-schoolGreen hover:text-white transition-all shadow-sm"
            >
              Change Selection
            </button>
          </div>

          <Card className="p-0 overflow-hidden shadow-xl border-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Marks (out of 100)</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(student => (
                    <tr key={student.student_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {student.roll_number || student.admission_number || student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{student.first_name} {student.last_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative w-32">
                          <input 
                            type="number" 
                            max="100"
                            min="0"
                            placeholder="0-100"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen focus:bg-white outline-none font-bold text-center transition-all"
                            value={marksData[student.student_id]}
                            onChange={(e) => setMarksData({...marksData, [student.student_id]: e.target.value})}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {marksData[student.student_id] !== '' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                              <CheckCircle2 size={14} /> Entered
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-xs font-bold">
                              <AlertCircle size={14} /> Pending
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No students found for the selected class and section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm font-medium text-gray-500">
                Total Students: <span className="font-bold text-gray-900">{students.length}</span> | 
                Entered: <span className="font-bold text-green-600">{Object.values(marksData).filter(v => v !== '').length}</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Back
                </button>
                <button 
                  disabled={saving || students.length === 0}
                  onClick={handleSaveMarks}
                  className="bg-schoolGreen text-white px-10 py-2.5 rounded-lg font-bold hover:bg-opacity-90 transition flex items-center gap-2 shadow-lg shadow-schoolGreen/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : <><Save size={20} /> Save Marks</>}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
