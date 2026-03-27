import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Card from '../../components/common/Card'
import { Plus, Search, Filter, Edit2, Trash2, X, Save, Phone, MapPin } from 'lucide-react'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  const classesList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const sectionsList = ['A', 'B', 'C', 'D']
  const [showModal, setShowModal] = useState(false)
  const [currentStudent, setCurrentStudent] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    class_: '',
    section: '',
    roll_no: '',
    academic_year: '2025-2026',
    admission_number: '',
    parent_id: ''
  })
  const [showParentModal, setShowParentModal] = useState(false)
  const [parentFormData, setParentFormData] = useState({
    father_name: '',
    mother_name: '',
    phone_primary: '',
    address: ''
  })
  const [errors, setErrors] = useState({})
  const [parentErrors, setParentErrors] = useState({})


  useEffect(() => {
    fetchParents()
  }, [])

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents()
    } else {
      setStudents([])
    }
  }, [selectedClass, selectedSection])

  const fetchParents = async () => {
    try {
      const token = localStorage.getItem('token')
      const parRes = await fetch(`${API_BASE_URL}/api/v1/admin/parents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (parRes.ok) setParents(await parRes.json())
    } catch (error) {
      console.error('Failed to fetch parents:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const stuRes = await fetch(`${API_BASE_URL}/api/v1/admin/students?class_name=${selectedClass}&section=${selectedSection}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (stuRes.ok) {
        setStudents(await stuRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    
    // Custom Validation
    const newErrors = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'First Name is required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last Name is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required'
    if (!formData.roll_no.trim()) newErrors.roll_no = 'Roll number is required'
    if (!formData.parent_id) {
      newErrors.parent_id = 'Please select a parent or add a new one.'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const url = currentStudent 
        ? `${API_BASE_URL}/api/v1/admin/students/${currentStudent.student_id}`
        : `${API_BASE_URL}/api/v1/admin/students`
      
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        class: formData.class_,
        section: formData.section,
        roll_no: formData.roll_no,
        academic_year: formData.academic_year,
        admission_number: formData.admission_number,
        parent_id: formData.parent_id
      }
      
      const response = await fetch(url, {
        method: currentStudent ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowModal(false)
        fetchStudents()
        setCurrentStudent(null)
        setFormData({ 
          student_id: '', 
          first_name: '', 
          last_name: '', 
          gender: '', 
          date_of_birth: '', 
          class_: selectedClass, 
          section: selectedSection, 
          roll_no: '', 
          academic_year: '2025-2026',
          admission_number: '',
          parent_id: '' 
        })
        setErrors({})
      }
    } catch (error) {
      console.error('Operation failed:', error)
    }
  }

  const handleCreateParent = async (e) => {
    e.preventDefault()
    
    // Custom Validation
    const pErrors = {}
    if (!parentFormData.father_name.trim()) pErrors.father_name = 'Father\'s name is required'
    if (!parentFormData.phone_primary.trim()) pErrors.phone_primary = 'Primary phone is required'
    if (!parentFormData.address.trim()) pErrors.address = 'Address is required'
    
    if (Object.keys(pErrors).length > 0) {
      setParentErrors(pErrors)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/parents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parentFormData)
      })

      if (response.ok) {
        const newParent = await response.json()
        
        // Refresh parents list
        const parRes = await fetch(`${API_BASE_URL}/api/v1/admin/parents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (parRes.ok) {
          const updatedParents = await parRes.json()
          setParents(updatedParents)
          // Automatically select the newly created parent
          setFormData(prev => ({ ...prev, parent_id: newParent.parent_id }))
          setErrors(prev => ({ ...prev, parent_id: null }))
        }
        
        setShowParentModal(false)
        setParentFormData({ father_name: '', mother_name: '', phone_primary: '', address: '' })
        setParentErrors({})
      } else {
        const errData = await response.json().catch(() => null)
        const errMsg = errData?.detail || 'Failed to create parent. Phone number might already exist.'
        setParentErrors({ api: errMsg })
      }
    } catch (error) {
      console.error('Parent creation failed:', error)
      setParentErrors({ api: 'Network error occurred. Please try again.' })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) fetchStudents()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const openModal = (student = null) => {
    if (student) {
      setCurrentStudent(student)
      setFormData({
        student_id: student.student_id,
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        gender: student.gender || '',
        date_of_birth: student.date_of_birth || '',
        class_: student.class_ || '',
        section: student.section || '',
        roll_no: student.roll_number || student.roll_no || '',
        academic_year: student.academic_year || '2025-2026',
        admission_number: student.admission_number || '',
        parent_id: student.parent_id || ''
      })
    } else {
      setCurrentStudent(null)
      setFormData({ 
        student_id: '', 
        first_name: '', 
        last_name: '', 
        gender: '', 
        date_of_birth: '', 
        class_: selectedClass, 
        section: selectedSection, 
        roll_no: '', 
        academic_year: '2025-2026',
        admission_number: '',
        parent_id: '' 
      })
    }
    setErrors({})
    setShowModal(true)
  }

  const filteredStudents = students.filter(s => {
    const studentName = s.name || `${s.first_name} ${s.last_name}`
    return studentName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen">Student Management</h1>
          <p className="text-gray-600">Total {filteredStudents.length} students found</p>
        </div>
        <button 
          onClick={() => {
            if (!selectedClass || !selectedSection) {
              alert("Please select Class and Section first before adding a student.")
              return
            }
            openModal()
          }}
          disabled={!selectedClass || !selectedSection}
          className="flex items-center gap-2 bg-schoolGreen text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={20} className="text-gray-400" />
              <select 
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-auto pl-0 sm:pl-2">
              <select 
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="">Select Section</option>
                {sectionsList.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
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
              {!(selectedClass && selectedSection) ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Please select a Class and Section to view students.</td></tr>
              ) : loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading students...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No students found.</td></tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.student_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.student_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.name || `${student.first_name} ${student.last_name}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-bold">{student.class_} - {student.section}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.roll_number || student.roll_no}</td>
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
                      type="text" 
                      placeholder="Enter first name"
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.first_name ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                      value={formData.first_name}
                      onChange={(e) => {
                        setFormData({...formData, first_name: e.target.value})
                        if (errors.first_name) setErrors({...errors, first_name: null})
                      }}
                    />
                    {errors.first_name && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.first_name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Last Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Enter last name"
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.last_name ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                      value={formData.last_name}
                      onChange={(e) => {
                        setFormData({...formData, last_name: e.target.value})
                        if (errors.last_name) setErrors({...errors, last_name: null})
                      }}
                    />
                    {errors.last_name && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.last_name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Gender <span className="text-red-500">*</span></label>
                    <select 
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.gender ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                      value={formData.gender}
                      onChange={(e) => {
                        setFormData({...formData, gender: e.target.value})
                        if (errors.gender) setErrors({...errors, gender: null})
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.gender}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.date_of_birth ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                      value={formData.date_of_birth}
                      onChange={(e) => {
                        setFormData({...formData, date_of_birth: e.target.value})
                        if (errors.date_of_birth) setErrors({...errors, date_of_birth: null})
                      }}
                    />
                    {errors.date_of_birth && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.date_of_birth}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Class (Locked)</label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed rounded-xl outline-none"
                      value={formData.class_}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Section (Locked)</label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed rounded-xl outline-none"
                      value={formData.section}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Roll Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. 7A01"
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.roll_no ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                      value={formData.roll_no}
                      onChange={(e) => {
                        setFormData({...formData, roll_no: e.target.value})
                        if (errors.roll_no) setErrors({...errors, roll_no: null})
                      }}
                    />
                    {errors.roll_no && <p className="text-[11px] text-red-500 font-medium ml-1">{errors.roll_no}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Academic Year <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2025-2026"
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.academic_year ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                      value={formData.academic_year}
                      onChange={(e) => {
                        setFormData({...formData, academic_year: e.target.value})
                        if (errors.academic_year) setErrors({...errors, academic_year: null})
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Admission Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter admission number"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.admission_number}
                      onChange={(e) => setFormData({...formData, admission_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Select Parent <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.parent_id ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 appearance-none`}
                        value={formData.parent_id}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowParentModal(true)
                            setFormData({...formData, parent_id: ''})
                          } else {
                            setFormData({...formData, parent_id: e.target.value})
                            setErrors({...errors, parent_id: null})
                          }
                        }}
                      >
                        <option value="">Choose a parent</option>
                        {parents.map(p => (
                          <option key={p.parent_id} value={p.parent_id}>
                            {p.father_name} / {p.mother_name} ({p.parent_id})
                          </option>
                        ))}
                        <option value="ADD_NEW">➕ Add New Parent</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <Plus size={18} />
                      </div>
                    </div>
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

      {/* Quick Add Parent Modal */}
      {showParentModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold text-schoolGreen">Add New Parent</h2>
                <p className="text-sm text-gray-500 mt-1">Register parent details before assigning a student.</p>
              </div>
              <button 
                onClick={() => setShowParentModal(false)}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="quickParentForm" onSubmit={handleCreateParent} className="space-y-6">
                
                {parentErrors.api && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
                    {parentErrors.api}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Father's Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="Enter father's name"
                      className={`w-full px-4 py-2.5 bg-gray-50 border ${parentErrors.father_name ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                      value={parentFormData.father_name}
                      onChange={(e) => {
                        setParentFormData({...parentFormData, father_name: e.target.value})
                        if (parentErrors.father_name) setParentErrors({...parentErrors, father_name: null})
                      }}
                    />
                    {parentErrors.father_name && <p className="text-[11px] text-red-500 font-medium ml-1">{parentErrors.father_name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mother's Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter mother's name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={parentFormData.mother_name}
                      onChange={(e) => setParentFormData({...parentFormData, mother_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Primary Phone <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${parentErrors.phone_primary ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                      <input 
                        type="tel" 
                        placeholder="e.g. 9876543210 (Used for login)"
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${parentErrors.phone_primary ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200`}
                        value={parentFormData.phone_primary}
                        onChange={(e) => {
                          setParentFormData({...parentFormData, phone_primary: e.target.value})
                          if (parentErrors.phone_primary) setParentErrors({...parentErrors, phone_primary: null})
                        }}
                      />
                    </div>
                    {parentErrors.phone_primary && <p className="text-[11px] text-red-500 font-medium ml-1">{parentErrors.phone_primary}</p>}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Residential Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin className={`absolute left-3 top-3 ${parentErrors.address ? 'text-red-400' : 'text-gray-400'}`} size={18} />
                      <textarea 
                        rows="3"
                        placeholder="Enter complete residential address"
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${parentErrors.address ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 resize-none`}
                        value={parentFormData.address}
                        onChange={(e) => {
                          setParentFormData({...parentFormData, address: e.target.value})
                          if (parentErrors.address) setParentErrors({...parentErrors, address: null})
                        }}
                      />
                    </div>
                    {parentErrors.address && <p className="text-[11px] text-red-500 font-medium ml-1">{parentErrors.address}</p>}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button 
                type="button"
                onClick={() => setShowParentModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                form="quickParentForm"
                type="submit"
                className="px-8 py-2.5 rounded-xl bg-schoolGreen text-white text-sm font-semibold shadow-lg shadow-schoolGreen/20 hover:bg-opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <Plus size={20} /> Save & Select Parent
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
