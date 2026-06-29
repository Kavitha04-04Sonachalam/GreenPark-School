import React from 'react'
import { X, Printer, Download, CheckCircle } from 'lucide-react'

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  if (!isOpen || !receipt) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200 print:shadow-none print:max-h-full print:rounded-none print:w-full">
        {/* Header - Hidden on Print */}
        <div className="bg-schoolGreen p-4 text-white flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle size={20} className="text-yellow-300" />
            Receipt Generated Successfully
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-green-800 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Sheet */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible" id="receipt-print-area">
          {/* School Header info */}
          <div className="text-center border-b-2 border-gray-100 pb-6 mb-6">
            <div className="flex justify-center items-center gap-3 mb-2">
              <img 
                src="/school-logo.jpg" 
                alt="Green Park School Logo" 
                className="h-16 w-16 rounded-full object-cover border border-gray-150 bg-white" 
              />
              <div className="text-left">
                <h1 className="text-2xl font-black text-schoolGreen">GREEN PARK SCHOOL</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Main Campus Road, Perambalur, Tamil Nadu</p>
                <p className="text-[10px] text-gray-400 font-semibold">Phone: +91 97860 40113 | Email: info@greenparkschool.com</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-700 bg-gray-100 py-1.5 rounded-lg uppercase tracking-wider inline-block px-6">
              FEE PAYMENT RECEIPT
            </h2>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6 bg-gray-55/40 p-4 rounded-xl border border-gray-100 print:bg-white print:border-0 print:p-0">
            <div>
              <p className="text-gray-500 font-medium">Receipt No:</p>
              <p className="font-bold text-gray-800 text-base">{receipt.receipt_no}</p>
            </div>
            <div className="text-right print:text-left">
              <p className="text-gray-500 font-medium">Date & Time:</p>
              <p className="font-semibold text-gray-800">
                {new Date(receipt.payment_date).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Student Name:</p>
              <p className="font-bold text-gray-800">{receipt.student_name}</p>
            </div>
            <div className="text-right print:text-left">
              <p className="text-gray-500 font-medium">Class & Section:</p>
              <p className="font-bold text-gray-800">{receipt.class_name}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Admission No:</p>
              <p className="font-semibold text-gray-800">{receipt.admission_number}</p>
            </div>
            <div className="text-right print:text-left">
              <p className="text-gray-500 font-medium">Collected By:</p>
              <p className="font-medium text-gray-850">{receipt.collected_by || 'System'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 print:border-gray-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-200 print:bg-gray-100 print:border-gray-300">
                  <th className="py-2.5 px-4 font-bold text-gray-600 text-left">Term</th>
                  <th className="py-2.5 px-4 font-bold text-gray-600 text-left">Fee Category</th>
                  <th className="py-2.5 px-4 font-bold text-gray-600 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                {receipt.items && receipt.items.map((item, idx) => (
                  <tr key={idx} className="text-gray-800">
                    <td className="py-3 px-4 font-medium">{item.term}</td>
                    <td className="py-3 px-4 text-gray-650">{item.head_name || item.category}</td>
                    <td className="py-3 px-4 text-right font-bold">₹{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Split Blocks */}
          <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-8">
            {/* Mode Splits */}
            <div className="text-sm space-y-1.5 p-4 bg-gray-50 rounded-xl border border-gray-100 max-w-sm w-full print:bg-white print:border-0 print:p-0">
              <p className="font-bold text-gray-700 mb-2 uppercase tracking-wide text-xs">Payment Method Details</p>
              <p className="text-gray-600 flex justify-between">
                <span>Payment Mode:</span> 
                <span className="font-bold uppercase text-schoolGreen">{receipt.payment_mode}</span>
              </p>
              {receipt.scholarship_applied && (
                <p className="text-gray-600 flex justify-between">
                  <span>Scholarship:</span> 
                  <span className="font-bold text-yellow-600">{receipt.scholarship_applied}</span>
                </p>
              )}
            </div>

            {/* Balances block */}
            <div className="text-sm space-y-2 min-w-[240px]">
              <div className="flex justify-between text-gray-600">
                <span>Total Amount Paid:</span>
                <span className="font-extrabold text-gray-900 text-base">₹{receipt.total_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-2 font-bold">
                <span>Remaining Balance:</span>
                <span className="text-red-600">₹{receipt.balance_remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Disclaimers */}
          <div className="text-center border-t border-gray-150 pt-6 text-[11px] text-gray-400 space-y-1 leading-relaxed">
            <p>* This is a computer-generated fee receipt and does not require a physical signature.</p>
            <p>Green Park School, Perambalur. Keep this receipt safe for your academic records.</p>
          </div>
        </div>

        {/* Modal Actions - Hidden on Print */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
          <div className="text-xs text-gray-400 font-medium">
            Ctrl + P to print directly
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100 hover:border-gray-300 transition active:scale-95"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-schoolGreen text-white text-sm font-semibold shadow-lg shadow-schoolGreen/20 hover:bg-green-700 transition active:scale-95 flex items-center gap-2"
            >
              <Printer size={18} />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
