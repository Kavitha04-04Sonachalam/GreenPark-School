import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Card from '../../components/common/Card'
import { Plus, Search, Filter, Edit2, Trash2, X, Save } from 'lucide-react'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [currentStudent, setCurrentStudent] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    class_: '',
    section: '',
    roll_number: '',
    admission_number: '',
    parent_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const [stuRes, parRes] = await Promise.all([
        fetch('http://localhost:8000/api/v1/admin/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/v1/admin/parents', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      if (stuRes.ok) setStudents(await stuRes.json())
      if (parRes.ok) setParents(await parRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const url = currentStudent 
        ? `http://localhost:8000/api/v1/admin/students/${currentStudent.student_id}`
        : 'http://localhost:8000/api/v1/admin/students'
      
      const response = await fetch(url, {
        method: currentStudent ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        fetchData()
        setCurrentStudent(null)
        setFormData({ student_id: '', first_name: '', last_name: '', class_: '', section: '', roll_number: '', admission_number: '', parent_id: '' })
      }
    } catch (error) {
      console.error('Operation failed:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/v1/admin/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) fetchData()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const openModal = (student = null) => {
    if (student) {
      setCurrentStudent(student)
      setFormData({
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        class_: student.class_ || '',
        section: student.section,
        roll_number: student.roll_number,
        admission_number: student.admission_number,
        parent_id: student.parent_id
      })
    } else {
      setCurrentStudent(null)
      setFormData({ student_id: '', first_name: '', last_name: '', class_: '', section: '', roll_number: '', admission_number: '', parent_id: '' })
    }
    setShowModal(true)
  }

  const filteredStudents = students.filter(s => {
    const nameMatch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const classMatch = classFilter === 'All' || s.class_ === classFilter
    return nameMatch && classMatch
  })

  const classes = ['All', ...new Set(students.map(s => s.class_).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen">Student Management</h1>
          <p className="text-gray-600">Total {filteredStudents.length} students found</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-schoolGreen text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
        >
          <Plus size={20} /> Add New Student
        </button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search students by name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select 
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent ID</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading students...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No students found.</td></tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.student_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.student_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.first_name} {student.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-bold">{student.class_} - {student.section}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.roll_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.parent_id}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openModal(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(student.student_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Overlay */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold text-schoolGreen">
                  {currentStudent ? 'Update Student Profile' : 'Register New Student'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the details below to manage student records.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="studentForm" onSubmit={handleCreateOrUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">First Name <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter first name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Last Name <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter last name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Class <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. 10"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.class_}
                      onChange={(e) => setFormData({...formData, class_: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Section <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. A"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Roll Number <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter roll number"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({...formData, roll_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Admission Number <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter admission number"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.admission_number}
                      onChange={(e) => setFormData({...formData, admission_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Select Parent <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 appearance-none"
                      value={formData.parent_id}
                      onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                    >
                      <option value="">Choose a parent</option>
                      {parents.map(p => (
                        <option key={p.parent_id} value={p.parent_id}>
                          {p.father_name} / {p.mother_name} ({p.parent_id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                form="studentForm"
                type="submit"
                className="px-8 py-2.5 rounded-xl bg-schoolGreen text-white text-sm font-semibold shadow-lg shadow-schoolGreen/20 hover:bg-opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <Save size={20} /> {currentStudent ? 'Update Information' : 'Register Student'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
