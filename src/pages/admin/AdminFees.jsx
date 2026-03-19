import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { DollarSign, TrendingUp, RefreshCw, Search } from 'lucide-react'

export default function AdminFees() {
  const [feeData, setFeeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')

  const classesList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const sectionsList = ['A', 'B', 'C', 'D']

  const fetchFees = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = 'http://localhost:8000/api/v1/admin/fees'
      const params = new URLSearchParams()
      if (selectedClass) params.append('class_name', selectedClass)
      if (selectedSection) params.append('section', selectedSection)
      if (params.toString()) url += `?${params.toString()}`

      console.log('DEBUG: Fetching fees from:', url)

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFeeData(data)
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('Failed to fetch fees:', response.status, errData)
        if (response.status === 401) {
            alert('Your session has expired. Please login again.')
        }
      }
    } catch (error) {
      console.error('Network error while fetching fees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFees()
  }, [selectedClass, selectedSection])

  const filteredFees = (feeData || []).filter(f => {
    const sName = (f.student_name || '').toLowerCase()
    const sId = String(f.student_id || '').toLowerCase()
    const search = (searchTerm || '').toLowerCase()
    return sName.includes(search) || sId.includes(search)
  })

  console.log('DEBUG: Fee data received:', feeData)
  console.log('DEBUG: Filtered fees:', filteredFees)

  const totalFees = filteredFees.reduce((sum, f) => sum + f.amount, 0)
  const paidFees = filteredFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)
  const pendingFees = filteredFees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center text-schoolGreen">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fee Management</h1>
          <p className="text-gray-600">Track and manage all student fees</p>
        </div>
        <button 
          onClick={fetchFees}
          className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400"
          title="Refresh Data"
        >
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-bold">
        <Card className="border-l-4 border-schoolGreen bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Total Fees</p>
              <p className="text-2xl text-gray-900">₹{totalFees.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-schoolGreen">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Collected</p>
              <p className="text-2xl text-green-600">₹{paidFees.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-red-500 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Pending</p>
              <p className="text-2xl text-red-600">₹{pendingFees.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-red-500">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Fees Table */}
      <Card className="p-0 overflow-hidden border-0 shadow-xl">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-schoolGreen">Fee Collection Records</h2>
            
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <select 
                  className="flex-1 md:w-36 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition-all text-sm font-medium text-gray-700 cursor-pointer"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>

                <select 
                  className="flex-1 md:w-36 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen outline-none transition-all text-sm font-medium text-gray-700 cursor-pointer"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="">All Sections</option>
                  {sectionsList.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Student Name</th>
                <th className="text-left py-4 px-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">ID</th>
                <th className="text-left py-4 px-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Class</th>
                <th className="text-left py-4 px-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Month</th>
                <th className="text-right py-4 px-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Amount</th>
                <th className="text-center py-4 px-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan="6" className="py-20 text-center text-gray-400 italic">Fetching fee records...</td></tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <DollarSign size={40} className="opacity-20" />
                      <p>No fee records match your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => (
                  <tr key={fee.fee_id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="py-4 px-6 font-bold text-gray-900">{fee.student_name}</td>
                    <td className="py-4 px-6 text-gray-400 font-mono text-xs">{fee.student_id}</td>
                    <td className="py-4 px-6 text-gray-600 font-medium">{fee.class}</td>
                    <td className="py-4 px-6 text-gray-600">{fee.month}</td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900">₹{fee.amount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          fee.status === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {fee.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
