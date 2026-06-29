import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Card from '../../components/common/Card'
import { Plus, Search, Edit2, Trash2, X, Save, Phone, MapPin, Briefcase, Shield, Calendar, UserCheck } from 'lucide-react'

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter States
  const [filterGender, setFilterGender] = useState('')
  const [filterDesignation, setFilterDesignation] = useState('')
  const [filterAccessRights, setFilterAccessRights] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [currentStaff, setCurrentStaff] = useState(null)
  
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    gender: 'Male',
    mobile_no: '',
    designation: 'Teacher',
    date_of_joining: '',
    door_no: '',
    street_name: '',
    district: '',
    state: '',
    pincode: '',
    access_rights: 'General Academics',
    password: '',
    is_active: true
  })

  const [errors, setErrors] = useState({})

  // Dropdown list options
  const designations = ['Teacher', 'Principal', 'Admin Staff', 'Clerk', 'Accountant', 'Coordinator']
  const accessRightsList = ['General Academics', 'Science', 'Mathematics', 'Administrative', 'Full Access']

  useEffect(() => {
    fetchStaff()
  }, [filterGender, filterDesignation, filterAccessRights, filterStatus])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = `${API_BASE_URL}/api/v1/staff`
      const params = new URLSearchParams()
      
      if (filterGender) params.append('gender', filterGender)
      if (filterDesignation) params.append('designation', filterDesignation)
      if (filterAccessRights) params.append('access_rights', filterAccessRights)
      if (filterStatus !== '') params.append('is_active', filterStatus)
      if (searchTerm) params.append('search', searchTerm)

      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStaffList(data)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on debounce or button trigger
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    fetchStaff()
  }

  const validateForm = () => {
    const errs = {}
    if (!formData.employee_id.trim()) errs.employee_id = 'Employee ID is required'
    if (!formData.employee_name.trim()) errs.employee_name = 'Employee Name is required'
    
    // Mobile validation: exactly 10 digits
    const mobileClean = formData.mobile_no.trim()
    if (!mobileClean) {
      errs.mobile_no = 'Mobile Number is required'
    } else if (!/^\d{10}$/.test(mobileClean)) {
      errs.mobile_no = 'Mobile Number must be exactly 10 digits'
    }

    // Pincode validation: exactly 6 digits if provided
    const pincodeClean = formData.pincode.trim()
    if (pincodeClean && !/^\d{6}$/.test(pincodeClean)) {
      errs.pincode = 'Pincode must be exactly 6 digits'
    }

    // Password validation: required and min 8 characters on create
    if (!currentStaff) {
      if (!formData.password) {
        errs.password = 'Login Password is required'
      } else if (formData.password.length < 8) {
        errs.password = 'Password must be at least 8 characters'
      }
    } else if (formData.password && formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const token = localStorage.getItem('token')
      const url = currentStaff
        ? `${API_BASE_URL}/api/v1/staff/${currentStaff.id}`
        : `${API_BASE_URL}/api/v1/staff`

      const payload = { ...formData }
      // Remove blank password on edit to avoid updating it
      if (currentStaff && !payload.password) {
        delete payload.password
      }

      const response = await fetch(url, {
        method: currentStaff ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowModal(false)
        fetchStaff()
      } else {
        const errData = await response.json()
        alert(errData.detail || 'Operation failed')
      }
    } catch (error) {
      console.error('Operation failed:', error)
      alert('Something went wrong. Please try again.')
    }
  }

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Deleting this employee (${name}) will also remove their login account. Are you sure?`
    )
    if (!confirmed) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/staff/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchStaff()
      } else {
        const errData = await response.json()
        alert(errData.detail || 'Failed to delete staff member')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const openModal = (staff = null) => {
    if (staff) {
      setCurrentStaff(staff)
      setFormData({
        employee_id: staff.employee_id,
        employee_name: staff.employee_name,
        gender: staff.gender || 'Male',
        mobile_no: staff.mobile_no || '',
        designation: staff.designation || 'Teacher',
        date_of_joining: staff.date_of_joining || '',
        door_no: staff.door_no || '',
        street_name: staff.street_name || '',
        district: staff.district || '',
        state: staff.state || '',
        pincode: staff.pincode || '',
        access_rights: staff.access_rights || 'General Academics',
        password: '', // Always leave blank in edit modal
        is_active: staff.is_active !== undefined ? staff.is_active : true
      })
    } else {
      setCurrentStaff(null)
      setFormData({
        employee_id: '',
        employee_name: '',
        gender: 'Male',
        mobile_no: '',
        designation: 'Teacher',
        date_of_joining: new Date().toISOString().split('T')[0],
        door_no: '',
        street_name: '',
        district: '',
        state: '',
        pincode: '',
        access_rights: 'General Academics',
        password: '',
        is_active: true
      })
    }
    setErrors({})
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen">Staff Management</h1>
          <p className="text-gray-600">
            Total {staffList.length} staff members registered
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-schoolGreen text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition font-bold"
        >
          <Plus size={20} /> Add Staff
        </button>
      </div>

      <Card>
        {/* Search & Filters */}
        <div className="space-y-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by Employee ID, Name or Mobile..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-schoolGreen hover:bg-opacity-90 text-white font-bold px-6 py-2 rounded-lg transition"
            >
              Search
            </button>
          </form>

          {/* Quick Select Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
            >
              <option value="">All Designations</option>
              {designations.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
              value={filterAccessRights}
              onChange={(e) => setFilterAccessRights(e.target.value)}
            >
              <option value="">All Access Rights</option>
              {accessRightsList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Staff Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Employee ID</th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Name</th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Gender</th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Mobile</th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Designation</th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Access Rights</th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Date of Joining</th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-3 text-right font-bold text-gray-500 uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                    Loading staff records...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                    No staff records found matching the filters.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50/55 transition">
                    <td className="px-6 py-4 font-bold text-schoolGreen">{staff.employee_id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{staff.employee_name}</td>
                    <td className="px-6 py-4 text-gray-600">{staff.gender}</td>
                    <td className="px-6 py-4 text-gray-600">{staff.mobile_no}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{staff.designation}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-semibold">{staff.access_rights}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(staff.date_of_joining).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                          staff.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openModal(staff)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition inline-block"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(staff.id, staff.employee_name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition inline-block"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Portal Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold text-schoolGreen">
                  {currentStaff ? 'Update Staff Profile' : 'Register New Staff'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in the details below to manage staff records and logins.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="staffForm" onSubmit={handleCreateOrUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Employee ID <span className="text-red-500">*</span></label>
                    <input 
                      required
                      disabled={!!currentStaff}
                      type="text" 
                      placeholder="e.g. STF010"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    />
                    {errors.employee_id && <p className="text-xs text-red-500 font-medium">{errors.employee_id}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Employee Name <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter employee's name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.employee_name}
                      onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                    />
                    {errors.employee_name && <p className="text-xs text-red-500 font-medium">{errors.employee_name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Gender <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        type="tel" 
                        placeholder="10-digit phone number"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                        value={formData.mobile_no}
                        onChange={(e) => setFormData({...formData, mobile_no: e.target.value})}
                      />
                    </div>
                    {errors.mobile_no && <p className="text-xs text-red-500 font-medium">{errors.mobile_no}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Designation <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    >
                      {designations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Access Rights <span className="text-red-500">*</span></label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.access_rights}
                      onChange={(e) => setFormData({...formData, access_rights: e.target.value})}
                    >
                      {accessRightsList.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Date of Joining <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.date_of_joining}
                      onChange={(e) => setFormData({...formData, date_of_joining: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Status</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.is_active.toString()}
                      onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  {/* Address Group */}
                  <div className="space-y-1.5 md:col-span-2 border-t border-gray-100 pt-4">
                    <h3 className="font-bold text-gray-700 text-sm mb-3">Residential Address Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input 
                        type="text" 
                        placeholder="Door / Flat No"
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                        value={formData.door_no}
                        onChange={(e) => setFormData({...formData, door_no: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Street Name"
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 md:col-span-2"
                        value={formData.street_name}
                        onChange={(e) => setFormData({...formData, street_name: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="District"
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                        value={formData.district}
                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="State"
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                      />
                      <div>
                        <input 
                          type="text" 
                          placeholder="Pincode (6 digits)"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                          value={formData.pincode}
                          onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                        />
                        {errors.pincode && <p className="text-xs text-red-500 font-medium mt-1">{errors.pincode}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Password / Login Setup */}
                  <div className="space-y-1.5 md:col-span-2 border-t border-gray-100 pt-4">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      Login Account Setup <span className="text-red-550 font-bold text-xs uppercase bg-red-50 border border-red-100 px-2 py-0.5 rounded">Setup Password</span>
                    </label>
                    <input 
                      type="password" 
                      placeholder={currentStaff ? "Leave blank to keep existing password" : "Enter login password (min 8 characters)"}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    {errors.password && <p className="text-xs text-red-500 font-medium mt-1">{errors.password}</p>}
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      Username will be the employee's <strong>Mobile Number</strong>. Logins will be created under the <strong>staff</strong> role.
                    </p>
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
                form="staffForm"
                type="submit"
                className="px-8 py-2.5 rounded-xl bg-schoolGreen text-white text-sm font-semibold shadow-lg shadow-schoolGreen/20 hover:bg-opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <Save size={20} /> {currentStaff ? 'Update Profile' : 'Save Employee'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
