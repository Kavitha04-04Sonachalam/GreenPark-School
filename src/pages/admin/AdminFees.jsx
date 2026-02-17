import Card from '../../components/common/Card'
import { DollarSign, TrendingUp } from 'lucide-react'

export default function AdminFees() {
  const feeData = [
    { student: 'Aditya Kumar', class: '10A', amount: 5000, status: 'Paid' },
    { student: 'Priya Singh', class: '9B', amount: 5000, status: 'Pending' },
    { student: 'Rahul Patel', class: '8A', amount: 4500, status: 'Pending' }
  ]

  const totalFees = feeData.reduce((sum, f) => sum + f.amount, 0)
  const paidFees = feeData.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)
  const pendingFees = feeData.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">Fee Management</h1>
        <p className="text-gray-600">Track and manage all student fees</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Fees</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">₹{totalFees}</p>
            </div>
            <DollarSign className="text-schoolYellow" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-2">₹{paidFees}</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-red-600 mt-2">₹{pendingFees}</p>
            </div>
            <DollarSign className="text-red-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Fee Collection</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {feeData.map((fee, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{fee.student}</td>
                  <td className="py-3 px-4">{fee.class}</td>
                  <td className="py-3 px-4 text-right font-semibold">₹{fee.amount}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        fee.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {fee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
