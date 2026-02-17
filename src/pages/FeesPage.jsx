import { useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import Button from '../components/common/Button'
import { DollarSign, CheckCircle, AlertCircle } from 'lucide-react'

export default function FeesPage() {
  const { selectedChild } = useSelectedChild()
  const { data, loading, fetchFees } = useData()

  useEffect(() => {
    if (selectedChild) {
      fetchFees(selectedChild.id)
    }
  }, [selectedChild])

  if (loading) return <LoadingSpinner />

  const totalFees = data.fees.reduce((sum, f) => sum + f.amount, 0)
  const paidFees = data.fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)
  const pendingFees = data.fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">Fee Management</h1>
        <p className="text-gray-600">{selectedChild?.name} - {selectedChild?.class}</p>
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
              <p className="text-gray-600 text-sm">Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-2">₹{paidFees}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-red-600 mt-2">₹{pendingFees}</p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Fee Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.fees.map(fee => (
                <tr key={fee.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{fee.month}</td>
                  <td className="py-3 px-4">{fee.type}</td>
                  <td className="py-3 px-4 text-right font-semibold">₹{fee.amount}</td>
                  <td className="py-3 px-4">{fee.dueDate}</td>
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
                  <td className="py-3 px-4 text-center">
                    {fee.status === 'Pending' && (
                      <Button variant="secondary" size="sm">
                        Pay Now
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-4">Payment Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="border-2 border-schoolGreen rounded-lg p-4 hover:bg-schoolGreen hover:text-white transition">
            <p className="font-semibold">Online Payment</p>
            <p className="text-xs text-gray-600 mt-1">Pay via NEFT/RTGS</p>
          </button>
          <button className="border-2 border-schoolGreen rounded-lg p-4 hover:bg-schoolGreen hover:text-white transition">
            <p className="font-semibold">Check Payment</p>
            <p className="text-xs text-gray-600 mt-1">Cheque to school address</p>
          </button>
        </div>
      </Card>
    </div>
  )
}
