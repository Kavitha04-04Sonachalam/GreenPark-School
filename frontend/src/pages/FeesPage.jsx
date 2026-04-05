import { useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import Button from '../components/common/Button'
import { DollarSign, CheckCircle, AlertCircle, List } from 'lucide-react'

export default function FeesPage() {
  const { selectedChild } = useSelectedChild()
  const { data, loading, fetchFees } = useData()

  useEffect(() => {
    if (selectedChild) {
      const cls = selectedChild.class || selectedChild.class_;
      if (cls) {
          fetchFees(cls)
      }
    }
  }, [selectedChild])

  if (loading) return <LoadingSpinner />

  const feeComponents = data.fees?.components || [];
  const totalFees = feeComponents.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">Fee Management</h1>
        <p className="text-gray-600">{selectedChild?.name} - {selectedChild?.class}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Fees</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">₹{totalFees}</p>
            </div>
            <DollarSign className="text-schoolYellow" size={32} />
          </div>
        </Card>
      </div>

      {/* Fee Breakdown Display */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6 flex items-center gap-2">
          <List size={24} /> Fee Breakdown
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 max-w-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-left text-sm md:text-base mb-4">
            <tbody>
              {feeComponents.map((comp, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 text-gray-700 font-medium">{comp.component_name}</td>
                  <td className="py-2 text-right font-bold text-gray-900">₹{comp.amount?.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-b-2 border-gray-300">
                <td className="py-4 text-gray-800 font-bold uppercase tracking-wider">Total</td>
                <td className="py-4 text-right font-bold text-schoolGreen text-lg">₹{totalFees}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-6">
            <p className="text-sm text-gray-500 italic text-center">
              * Note: Actual fee payments and tracking are managed through our external ERP system. 
              This portal displays the confirmed fee structure only.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
