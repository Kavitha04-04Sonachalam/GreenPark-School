import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react'

export default function AdminFees() {
  const [feeData, setFeeData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFees = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/admin/fees', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFeeData(data)
      }
    } catch (error) {
      console.error('Failed to fetch fees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFees()
  }, [])

  const totalFees = feeData.reduce((sum, f) => sum + f.amount, 0)
  const paidFees = feeData.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)
  const pendingFees = feeData.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-schoolGreen mb-2">Fee Management</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-schoolGreen">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wider">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{totalFees.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-schoolGreen">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wider">Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-2">₹{paidFees.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-red-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-red-600 mt-2">₹{pendingFees.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-red-500">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Fee Collection Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">Student Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">ID</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">Class</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">Month</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">Amount</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-600 uppercase tracking-tighter">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="py-12 text-center text-gray-500">Loading fee records...</td></tr>
              ) : feeData.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-gray-500">No fee records found.</td></tr>
              ) : (
                feeData.map((fee) => (
                  <tr key={fee.fee_id} className="hover:bg-gray-50 transition group">
                    <td className="py-4 px-6 font-bold text-gray-900">{fee.student_name}</td>
                    <td className="py-4 px-6 text-gray-500">{fee.student_id}</td>
                    <td className="py-4 px-6 text-gray-600">{fee.class}</td>
                    <td className="py-4 px-6 text-gray-600">{fee.month}</td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900">₹{fee.amount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          fee.status === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
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
