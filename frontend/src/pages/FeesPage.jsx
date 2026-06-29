import { useState, useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import ReceiptModal from '../components/layout/ReceiptModal'
import { DollarSign, CheckCircle2, AlertTriangle, FileText, Printer, Download } from 'lucide-react'
import { API_BASE_URL } from '@/config'

export default function FeesPage() {
  const { selectedChild } = useSelectedChild()
  const { token } = useAuth()
  const [feeData, setFeeData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Receipt Modal state
  const [showReceipt, setShowReceipt] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState(null)

  const fetchStudentFeeSummary = async (studentId) => {
    setLoading(true)
    try {
      const storedToken = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/fees/student/${studentId}/summary`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFeeData(data)
      }
    } catch (e) {
      console.error('Failed to fetch fee details:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedChild) {
      fetchStudentFeeSummary(selectedChild.id)
    }
  }, [selectedChild])

  const handleViewReceipt = async (receiptNo) => {
    try {
      const storedToken = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/fees/receipt/${receiptNo}`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        setActiveReceipt(data)
        setShowReceipt(true)
      }
    } catch (e) {
      console.error('Failed to fetch receipt:', e)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!feeData) {
    return (
      <Card className="text-center py-20 text-gray-400">
        <DollarSign className="mx-auto mb-4 opacity-25" size={48} />
        <p className="text-lg font-medium">No fee records found for {selectedChild?.name}.</p>
      </Card>
    )
  }

  const { total_fee, total_paid, total_balance, summary, payment_history, active_scholarship } = feeData

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-schoolGreen mb-2">School Fees & Ledger</h1>
        <p className="text-gray-600 font-medium">
          Fee summary for <span className="font-bold text-schoolGreen">{selectedChild?.name}</span> ({selectedChild?.class})
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Fee Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Charged Fees</p>
              <p className="text-3xl font-bold text-schoolGreen mt-2">₹{total_fee.toLocaleString()}</p>
              {active_scholarship && (
                <p className="text-xs text-yellow-600 font-bold mt-1.5 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 w-fit">
                  🎓 {active_scholarship.name} Applied
                </p>
              )}
            </div>
            <DollarSign className="text-schoolGreen" size={32} />
          </div>
        </Card>

        {/* Total Paid Card */}
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Paid Fees</p>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{total_paid.toLocaleString()}</p>
              <p className="text-[10px] text-green-500 font-bold mt-1 uppercase flex items-center gap-1">
                <CheckCircle2 size={12} /> Transaction Cleared
              </p>
            </div>
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
        </Card>

        {/* Total Pending Card */}
        <Card highlight className={total_balance > 0 ? 'border-l-4 border-red-500' : ''}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Balance</p>
              <p className={`text-3xl font-bold mt-2 ${total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{total_balance.toLocaleString()}
              </p>
              {total_balance > 0 && (
                <p className="text-[10px] text-red-500 font-bold mt-1.5 uppercase flex items-center gap-1 bg-red-50 px-2 py-0.5 border border-red-100 rounded w-fit">
                  <AlertTriangle size={12} /> Please Pay Outstanding
                </p>
              )}
            </div>
            <AlertTriangle className={total_balance > 0 ? 'text-red-500' : 'text-green-500'} size={32} />
          </div>
        </Card>
      </div>

      {/* Fee Breakdown Table */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6 flex items-center gap-2">
          <FileText size={20} className="text-schoolYellow" /> Detailed Fee Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2.5 px-4 text-left font-bold text-gray-500 uppercase text-[10px]">Fee Head</th>
                <th className="py-2.5 px-4 text-left font-bold text-gray-500 uppercase text-[10px]">Term</th>
                <th className="py-2.5 px-4 text-right font-bold text-gray-500 uppercase text-[10px]">Base Amount</th>
                <th className="py-2.5 px-4 text-right font-bold text-gray-500 uppercase text-[10px]">Waiver</th>
                <th className="py-2.5 px-4 text-right font-bold text-gray-500 uppercase text-[10px]">Late Fee</th>
                <th className="py-2.5 px-4 text-right font-bold text-gray-500 uppercase text-[10px]">Net Due</th>
                <th className="py-2.5 px-4 text-right font-bold text-gray-500 uppercase text-[10px]">Paid</th>
                <th className="py-2.5 px-4 text-right font-bold text-gray-500 uppercase text-[10px]">Balance</th>
                <th className="py-2.5 px-4 text-center font-bold text-gray-500 uppercase text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 bg-white">
              {summary && summary.map((item, idx) => (
                <tr key={idx} className="text-gray-800 hover:bg-gray-50/40">
                  <td className="py-3 px-4 font-bold">{item.head_name}</td>
                  <td className="py-3 px-4 text-gray-600 font-medium">{item.term}</td>
                  <td className="py-3 px-4 text-right font-medium">₹{item.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-yellow-600 font-medium">₹{item.waiver_amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-orange-600 font-medium">₹{item.late_fee_amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">₹{item.net_due.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-bold">₹{item.paid.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-extrabold ${item.balance > 0 ? 'text-red-650' : 'text-gray-500'}`}>
                    ₹{item.balance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold inline-block ${
                      item.status === 'Paid' 
                        ? 'bg-green-100 text-green-700' 
                        : (item.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment History */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-green-500" /> Payment History & Receipts
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2.5 px-4 text-left font-bold text-gray-500 uppercase text-[10px]">Receipt No</th>
                <th className="py-2.5 px-4 text-left font-bold text-gray-500 uppercase text-[10px]">Payment Date</th>
                <th className="py-2.5 px-4 text-right font-bold text-gray-500 uppercase text-[10px]">Amount Paid</th>
                <th className="py-2.5 px-4 text-left font-bold text-gray-500 uppercase text-[10px]">Payment Mode</th>
                <th className="py-2.5 px-4 text-center font-bold text-gray-500 uppercase text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 bg-white">
              {payment_history && payment_history.length > 0 ? (
                payment_history.map((row, idx) => (
                  <tr key={idx} className="text-gray-800 hover:bg-gray-50/40">
                    <td className="py-3.5 px-4 font-bold text-schoolGreen">{row.receipt_no}</td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {new Date(row.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-gray-900">₹{row.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-gray-600 font-bold uppercase text-xs">{row.payment_mode}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleViewReceipt(row.receipt_no)}
                        className="px-3.5 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-schoolGreen font-bold rounded-lg transition text-xs flex items-center gap-1.5 mx-auto"
                      >
                        <Printer size={12} />
                        View / Reprint
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400 italic">
                    No payment history records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RECEIPT PREVIEW MODAL */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={activeReceipt}
      />
    </div>
  )
}
