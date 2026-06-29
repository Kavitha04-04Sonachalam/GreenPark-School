import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Card from '../../components/common/Card'
import { 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Search, 
  History, 
  UserCheck, 
  ShieldAlert, 
  Sparkles,
  Bookmark
} from 'lucide-react'

export default function AdminStudentPromotion() {
  const [activeTab, setActiveTab] = useState('promote') // 'promote' or 'history'
  
  // Selection states
  const [academicYears, setAcademicYears] = useState([])
  const [currentYearId, setCurrentYearId] = useState('')
  const [targetYearId, setTargetYearId] = useState('')
  const [currentClass, setCurrentClass] = useState('')
  const [targetClass, setTargetClass] = useState('')
  const [section, setSection] = useState('')
  
  // Data states
  const [students, setStudents] = useState([])
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Audit log states
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [promotionResult, setPromotionResult] = useState(null)

  const classesList = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const sectionsList = ['A', 'B', 'C', 'D']

  // Auto-next class mapping
  const classMap = {
    'Pre KG': 'LKG',
    'LKG': 'UKG',
    'UKG': '1',
    '1': '2',
    '2': '3',
    '3': '4',
    '4': '5',
    '5': '6',
    '6': '7',
    '7': '8',
    '8': '9',
    '9': '10',
    '10': '11',
    '11': '12',
    '12': 'Completed'
  }

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchAuditLogs()
    }
  }, [activeTab])

  // Map next class when current class changes
  useEffect(() => {
    if (currentClass) {
      const nextClass = classMap[currentClass] || ''
      setTargetClass(nextClass)
    } else {
      setTargetClass('')
    }
  }, [currentClass])

  // Fetch students whenever filters change
  useEffect(() => {
    if (currentYearId && targetYearId && currentClass) {
      fetchStudentPromotionStatus()
    } else {
      setStudents([])
      setSelectedStudentIds([])
    }
  }, [currentYearId, targetYearId, currentClass, section])

  const fetchAcademicYears = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/v1/academic-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAcademicYears(data)
        // Find default active year
        const active = data.find(ay => ay.status === 'ACTIVE')
        if (active) {
          setCurrentYearId(active.year_id.toString())
          // Set target year to next one if available
          const nextIndex = data.findIndex(ay => ay.year_id === active.year_id) - 1
          if (nextIndex >= 0 && nextIndex < data.length) {
            setTargetYearId(data[nextIndex].year_id.toString())
          } else if (data.length > 1) {
            // Find another one
            const target = data.find(ay => ay.year_id !== active.year_id)
            if (target) setTargetYearId(target.year_id.toString())
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch academic years:', err)
    }
  }

  const fetchStudentPromotionStatus = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = `${API_BASE_URL}/api/v1/admin/students/promotion-status?current_academic_year_id=${currentYearId}&target_academic_year_id=${targetYearId}&class_name=${currentClass}`
      if (section) {
        url += `&section=${section}`
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
        setSelectedStudentIds([]) // Reset selections
      }
    } catch (err) {
      console.error('Failed to fetch promotion status:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/students/promotion-logs?limit=200`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setAuditLogs(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const eligibleIds = students
        .filter(s => !s.already_promoted)
        .map(s => s.student_id)
      setSelectedStudentIds(eligibleIds)
    } else {
      setSelectedStudentIds([])
    }
  }

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Promotion execution
  const executePromotion = async () => {
    try {
      setPromoting(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/students/promote-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_ids: selectedStudentIds,
          target_academic_year_id: parseInt(targetYearId),
          class: targetClass,
          section: section || 'A' // default section A if not provided
        })
      })

      if (res.ok) {
        const data = await res.json()
        setPromotionResult(data)
        // Refresh student grid and logs
        fetchStudentPromotionStatus()
      } else {
        const errorData = await res.json().catch(() => null)
        alert(errorData?.detail || 'Promotion failed. Please verify target academic year fee structures.')
        setShowConfirmModal(false)
      }
    } catch (err) {
      console.error('Failed to promote students:', err)
      alert('An error occurred during promotion.')
    } finally {
      setPromoting(false)
    }
  }

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (s.roll_number && s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const eligibleCount = students.filter(s => !s.already_promoted).length
  const alreadyPromotedCount = students.filter(s => s.already_promoted).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen flex items-center gap-2">
            <Sparkles className="text-yellow-400 fill-yellow-400" size={24} />
            Promotion Management
          </h1>
          <p className="text-gray-600">Promote students in bulk across academic years dynamically with full transactional safety.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('promote')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition ${
            activeTab === 'promote' 
              ? 'border-schoolGreen text-schoolGreen' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} />
          Bulk Promotion Tool
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition ${
            activeTab === 'history' 
              ? 'border-schoolGreen text-schoolGreen' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={16} />
          Promotion Audit Logs
        </button>
      </div>

      {activeTab === 'promote' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Configuration Panel */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="p-5 border-l-4 border-l-schoolGreen">
              <h2 className="text-lg font-bold text-schoolGreen mb-4 flex items-center gap-2">
                <Bookmark className="text-schoolGreen" size={18} />
                Configuration
              </h2>
              
              <div className="space-y-4">
                {/* Current Year */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Current Academic Year</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-schoolGreen/20 focus:bg-white focus:outline-none"
                    value={currentYearId}
                    onChange={(e) => setCurrentYearId(e.target.value)}
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(ay => (
                      <option key={ay.year_id} value={ay.year_id}>
                        {ay.year_name} {ay.status === 'ACTIVE' ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Year */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Target Academic Year</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-schoolGreen/20 focus:bg-white focus:outline-none"
                    value={targetYearId}
                    onChange={(e) => setTargetYearId(e.target.value)}
                  >
                    <option value="">Select Target Year</option>
                    {academicYears.map(ay => (
                      <option key={ay.year_id} value={ay.year_id}>
                        {ay.year_name}
                      </option>
                    ))}
                  </select>
                </div>

                <hr className="border-gray-100" />

                {/* Current Class */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Current Class</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-schoolGreen/20 focus:bg-white focus:outline-none"
                    value={currentClass}
                    onChange={(e) => setCurrentClass(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>

                {/* Target Class */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Target Class</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-schoolGreen/20 focus:bg-white focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    disabled={currentClass === '12'}
                  >
                    <option value="">Select Target Class</option>
                    {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                    <option value="Completed">Completed / Alumni</option>
                  </select>
                </div>

                {/* Section (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Section (Optional)</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-schoolGreen/20 focus:bg-white focus:outline-none"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  >
                    <option value="">All Sections</option>
                    {sectionsList.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>
            </Card>

            {/* Instruction Warning */}
            <Card className="p-4 bg-yellow-50/50 border border-yellow-200 text-yellow-800 text-xs space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-yellow-950">
                <AlertCircle size={14} className="text-yellow-600" />
                Before Promoting
              </h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>Configure the Target Academic Year fee structures first.</li>
                <li>Make sure the Target Academic Year is defined.</li>
                <li>XII candidates automatically graduate to "Completed / Alumni" status.</li>
              </ul>
            </Card>
          </div>

          {/* Student Grid / Workspace */}
          <div className="xl:col-span-3 space-y-6">
            {/* Quick stats */}
            {currentYearId && targetYearId && currentClass && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Total Students Found</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{students.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Already Promoted</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">{alreadyPromotedCount}</h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <UserCheck size={20} />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Eligible to Promote</p>
                    <h3 className="text-2xl font-bold text-yellow-600 mt-1">{eligibleCount}</h3>
                  </div>
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                    <AlertCircle size={20} />
                  </div>
                </div>
              </div>
            )}

            <Card className="p-6">
              {/* Search and Action bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-schoolGreen/20 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={selectedStudentIds.length === 0 || !targetClass || !targetYearId}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-schoolGreen text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-schoolGreen/20 hover:bg-opacity-95 transition disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed text-sm"
                >
                  Promote Selected ({selectedStudentIds.length})
                </button>
              </div>

              {/* Table workspace */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          className="rounded text-schoolGreen focus:ring-schoolGreen cursor-pointer"
                          checked={students.length > 0 && selectedStudentIds.length === eligibleCount && eligibleCount > 0}
                          onChange={handleSelectAll}
                          disabled={students.length === 0 || eligibleCount === 0}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Class</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {!(currentYearId && targetYearId && currentClass) ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm">
                          Please configure Current Academic Year, Target Academic Year, and Current Class in the sidebar panel.
                        </td>
                      </tr>
                    ) : loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm">
                          <Loader2 className="animate-spin text-schoolGreen mx-auto mb-2" size={24} />
                          Loading students...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm">
                          No students matching filters found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const isAlreadyPromoted = student.already_promoted
                        const isGraduating = student.current_class === '12'
                        
                        return (
                          <tr 
                            key={student.student_id} 
                            className={`hover:bg-gray-50 transition ${isAlreadyPromoted ? 'bg-green-50/20' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                className="rounded text-schoolGreen focus:ring-schoolGreen cursor-pointer disabled:cursor-not-allowed"
                                checked={selectedStudentIds.includes(student.student_id)}
                                onChange={() => handleSelectStudent(student.student_id)}
                                disabled={isAlreadyPromoted}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.student_id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.roll_number || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-bold">
                              Class {student.current_class} - {student.current_section}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {isAlreadyPromoted ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle2 size={12} />
                                  Already Promoted to {student.promoted_to_class} ({student.promoted_to_section})
                                </span>
                              ) : isGraduating ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                                  <AlertCircle size={12} />
                                  XII Graduation Candidate
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  Eligible to Promote
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* History Audit Logs Panel */
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-schoolGreen">Promotion Auditing History</h2>
              <p className="text-xs text-gray-500">Audit log records of all student promotions, successes, and rollbacks.</p>
            </div>
            <button 
              onClick={fetchAuditLogs}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">From Year/Class</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">To Year/Class</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Promoted By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Details / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loadingLogs ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="animate-spin text-schoolGreen mx-auto mb-2" size={24} />
                      Loading logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No promotion history logged in database.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{log.student_name}</div>
                        <div className="text-[10px] text-gray-400">{log.student_id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>{log.current_academic_year_name}</div>
                        <div className="text-xs font-bold">Class {log.previous_class} - {log.previous_section}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>{log.target_academic_year_name}</div>
                        <div className="text-xs font-bold">Class {log.new_class} - {log.new_section}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{log.promotion_date}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{log.promoted_by}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          log.status === 'Success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs truncate text-gray-500">
                        {log.status === 'Failed' ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <ShieldAlert size={12} />
                            {log.error_message}
                          </span>
                        ) : (
                          'Enrollment & Fees OK'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation & Preview Modal */}
      {showConfirmModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-schoolGreen">Confirm Bulk Promotion</h3>
              <button 
                onClick={() => {
                  if (!promoting) {
                    setShowConfirmModal(false)
                    setPromotionResult(null)
                  }
                }}
                disabled={promoting}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <XCircle size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1">
              {!promotionResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-yellow-900 text-sm flex items-center gap-2">
                      <AlertCircle size={18} className="text-yellow-600" />
                      Promotion Preview Details
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-yellow-950 font-medium">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold">Source Year</p>
                        <p className="text-sm mt-0.5">
                          {academicYears.find(ay => ay.year_id.toString() === currentYearId)?.year_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold">Target Year</p>
                        <p className="text-sm mt-0.5">
                          {academicYears.find(ay => ay.year_id.toString() === targetYearId)?.year_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold">Source Class</p>
                        <p className="text-sm mt-0.5">Class {currentClass} {section ? `(${section})` : ''}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold">Target Class</p>
                        <p className="text-sm mt-0.5">Class {targetClass}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    You have selected <strong className="text-schoolGreen">{selectedStudentIds.length} students</strong>. 
                    Upon confirming, the system will close their active enrollments for the current year, 
                    create new active enrollment records for the target year under Class <strong>{targetClass}</strong>, 
                    and automatically assign their target year fee structures.
                  </p>

                  {promoting && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <Loader2 className="animate-spin text-schoolGreen" size={32} />
                      <p className="text-sm font-semibold text-schoolGreen">Processing promotions... Please wait.</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Results summary */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="text-green-600" size={24} />
                    <h4 className="font-bold text-gray-900 text-lg">Promotion Job Completed!</h4>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Processed</p>
                      <h4 className="text-lg font-bold text-gray-800">{promotionResult.total_processed}</h4>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-[10px] font-bold text-green-500 uppercase">Success</p>
                      <h4 className="text-lg font-bold text-green-700">{promotionResult.total_success}</h4>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-[10px] font-bold text-red-500 uppercase">Failed</p>
                      <h4 className="text-lg font-bold text-red-700">{promotionResult.total_failed}</h4>
                    </div>
                  </div>

                  {promotionResult.total_failed > 0 && (
                    <div className="space-y-2 mt-4">
                      <h5 className="text-xs font-bold text-red-700 uppercase flex items-center gap-1">
                        <XCircle size={14} />
                        Failed / Rolled back Students ({promotionResult.total_failed})
                      </h5>
                      <div className="max-h-40 overflow-y-auto border border-red-100 rounded-xl bg-red-50/20 divide-y divide-red-100 text-xs">
                        {promotionResult.results.filter(r => r.status === 'Failed').map(fail => (
                          <div key={fail.student_id} className="p-2.5 flex justify-between gap-4">
                            <div>
                              <span className="font-bold text-gray-900">{fail.student_name}</span> 
                              <span className="text-[10px] text-gray-500 ml-1">({fail.student_id})</span>
                            </div>
                            <span className="text-red-600 font-medium">{fail.error_message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {promotionResult.total_success > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-green-700 uppercase flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        Successfully Promoted Students ({promotionResult.total_success})
                      </h5>
                      <div className="max-h-40 overflow-y-auto border border-green-100 rounded-xl bg-green-50/20 divide-y divide-green-100 text-xs">
                        {promotionResult.results.filter(r => r.status === 'Success').map(succ => (
                          <div key={succ.student_id} className="p-2.5 text-gray-700 font-semibold">
                            {succ.student_name} <span className="text-[10px] text-gray-500 font-normal">({succ.student_id})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              {!promotionResult ? (
                <>
                  <button
                    disabled={promoting}
                    onClick={() => setShowConfirmModal(false)}
                    className="px-5 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={promoting}
                    onClick={executePromotion}
                    className="px-6 py-2 rounded-xl bg-schoolGreen text-white text-sm font-semibold shadow-md shadow-schoolGreen/20 hover:bg-opacity-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {promoting && <Loader2 className="animate-spin" size={16} />}
                    Confirm Promotion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setPromotionResult(null)
                  }}
                  className="px-6 py-2 rounded-xl bg-schoolGreen text-white text-sm font-semibold shadow-md shadow-schoolGreen/20 hover:bg-opacity-95"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
