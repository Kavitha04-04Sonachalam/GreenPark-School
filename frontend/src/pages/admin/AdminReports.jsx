import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { FileText, Download, Calendar, RefreshCw, BarChart2, DollarSign } from 'lucide-react'
import { getAcademicYears } from '../../api/fees/academicYear'
import {
  getFeesPendingReport,
  getFeesPaymentReport,
  getDailyCollectionReport,
  getRangeCollectionReport
} from '../../api/fees/feeReports'

export default function AdminReports() {
  const [academicYears, setAcademicYears] = useState([])
  const [selectedYearId, setSelectedYearId] = useState('')
  const [reportType, setReportType] = useState('class-wise') // class-wise, term-wise, year-wise, pending, daily, range
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState([])
  const [totalYearlyCollected, setTotalYearlyCollected] = useState(0)

  // Filters
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const fetchYears = async () => {
    try {
      const data = await getAcademicYears()
      setAcademicYears(data)
      const active = data.find(y => y.status === 'ACTIVE')
      if (active) {
        setSelectedYearId(active.year_id.toString())
      } else if (data.length > 0) {
        setSelectedYearId(data[0].year_id.toString())
      }
    } catch (e) {
      console.error('Error fetching academic years:', e)
    }
  }

  const fetchReport = async () => {
    if (!selectedYearId && !['daily', 'range'].includes(reportType)) return
    setLoading(true)
    try {
      if (reportType === 'class-wise') {
        const res = await getFeesPaymentReport({ academic_year_id: parseInt(selectedYearId) })
        const classGroups = {}
        res.rows.forEach(p => {
          const cls = p.school_class
          classGroups[cls] = (classGroups[cls] || 0) + p.amount_paid
        })
        const aggregated = Object.entries(classGroups).map(([class_name, collected_amount]) => ({
          class_name,
          collected_amount
        })).sort((a, b) => a.class_name.localeCompare(b.class_name, undefined, { numeric: true }))
        setReportData(aggregated)
        setTotalYearlyCollected(res.total_paid || 0)
      } else if (reportType === 'term-wise') {
        const res = await getFeesPaymentReport({ academic_year_id: parseInt(selectedYearId) })
        const termGroups = {}
        res.rows.forEach(p => {
          const term = p.term_name
          termGroups[term] = (termGroups[term] || 0) + p.amount_paid
        })
        const aggregated = Object.entries(termGroups).map(([term, collected_amount]) => ({
          term,
          collected_amount
        })).sort((a, b) => a.term.localeCompare(b.term))
        setReportData(aggregated)
        setTotalYearlyCollected(res.total_paid || 0)
      } else if (reportType === 'year-wise') {
        const res = await getFeesPaymentReport({ academic_year_id: parseInt(selectedYearId) })
        setTotalYearlyCollected(res.total_paid || 0)
        setReportData([res])
      } else if (reportType === 'pending') {
        const res = await getFeesPendingReport({ academic_year_id: parseInt(selectedYearId) })
        const studentGroups = {}
        res.rows.forEach(row => {
          const key = `${row.student_name}_${row.school_class}`
          if (!studentGroups[key]) {
            studentGroups[key] = {
              student_name: row.student_name,
              class_name: row.school_class,
              total: 0,
              paid: 0,
              balance: 0
            }
          }
          studentGroups[key].total += row.total_fee
          studentGroups[key].paid += row.paid
          studentGroups[key].balance += row.pending
        })
        setReportData(Object.values(studentGroups))
      } else if (reportType === 'daily') {
        const res = await getDailyCollectionReport({ date: reportDate })
        const mapped = res.rows.map(r => ({
          receipt_no: r.receipt_no,
          student_name: r.student_name,
          amount: r.amount_paid,
          payment_mode: r.payment_mode,
          collected_by: 'Admin',
          time: new Date(r.payment_date).toLocaleString()
        }))
        setReportData(mapped)
      } else if (reportType === 'range') {
        const res = await getRangeCollectionReport({ start_date: startDate, end_date: endDate })
        const mapped = res.rows.map(r => ({
          receipt_no: r.receipt_no,
          student_name: r.student_name,
          amount: r.amount_paid,
          payment_mode: r.payment_mode,
          collected_by: 'Admin',
          time: new Date(r.payment_date).toLocaleString()
        }))
        setReportData(mapped)
      }
    } catch (e) {
      console.error('Error fetching reports data:', e)
      setReportData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchYearlyCollected = async () => {
    if (!selectedYearId) return
    try {
      const res = await getFeesPaymentReport({ academic_year_id: parseInt(selectedYearId) })
      setTotalYearlyCollected(res.total_paid || 0)
    } catch (e) {
      console.error('Error fetching yearly collected:', e)
    }
  }

  useEffect(() => {
    fetchYears()
  }, [])

  useEffect(() => {
    fetchReport()
    fetchYearlyCollected()
  }, [selectedYearId, reportType, reportDate, startDate, endDate])

  const exportCSV = () => {
    if (reportData.length === 0) return

    let csvContent = 'data:text/csv;charset=utf-8,'
    let headers = []
    let rows = []

    if (reportType === 'class-wise') {
      headers = ['Class Name', 'Collected Amount']
      rows = reportData.map(r => [r.class_name, r.collected_amount])
    } else if (reportType === 'term-wise') {
      headers = ['Term Name', 'Collected Amount']
      rows = reportData.map(r => [r.term, r.collected_amount])
    } else if (reportType === 'year-wise') {
      headers = ['Total Academic Year Collection']
      rows = [[totalYearlyCollected]]
    } else if (reportType === 'pending') {
      headers = ['Student Name', 'Class Name', 'Total Structure Amount', 'Paid Amount', 'Outstanding Balance']
      rows = reportData.map(r => [r.student_name, r.class_name, r.total, r.paid, r.balance])
    } else {
      headers = ['Receipt Number', 'Student Name', 'Amount Paid', 'Payment Mode', 'Collected By', 'Time']
      rows = reportData.map(r => [r.receipt_no, r.student_name, r.amount, r.payment_mode, r.collected_by, r.time])
    }

    csvContent += headers.join(',') + '\n'
    rows.forEach(row => {
      csvContent += row.map(val => `"${val}"`).join(',') + '\n'
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Fee_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title Block */}
      <div className="flex justify-between items-center text-schoolGreen">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Reports & Ledgers</h1>
          <p className="text-gray-600">Analyze collections, outstanding accounts, and term splits</p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card highlight className="bg-emerald-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Year Collection</p>
              <p className="text-3xl font-black text-emerald-700 mt-2">₹{totalYearlyCollected.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-650">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card highlight className="bg-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Academic Year</p>
              <p className="text-2xl font-bold text-blue-800 mt-2">
                {academicYears.find(y => y.year_id === parseInt(selectedYearId))?.year_name || 'Loading...'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-650">
              <BarChart2 size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="flex flex-wrap gap-6 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Report Type</label>
              <select
                value={reportType}
                onChange={e => {
                  setReportType(e.target.value)
                  setReportData([])
                }}
                className="p-2.5 border rounded-xl bg-white font-bold outline-none text-gray-700 focus:ring-2 focus:ring-schoolGreen/20"
              >
                <option value="class-wise">Class-wise Collections</option>
                <option value="term-wise">Term-wise Collections</option>
                <option value="year-wise">Year-wise Total</option>
                <option value="pending">Outstanding Balances</option>
                <option value="daily">Daily Collections Ledger</option>
                <option value="range">Range Collections Ledger</option>
              </select>
            </div>

            {/* Academic Year select (only for yearly queries) */}
            {!['daily', 'range'].includes(reportType) && (
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Academic Year</label>
                <select
                  value={selectedYearId}
                  onChange={e => setSelectedYearId(e.target.value)}
                  className="p-2.5 border rounded-xl bg-white font-bold outline-none text-gray-700 focus:ring-2 focus:ring-schoolGreen/20"
                >
                  {academicYears.map(ay => (
                    <option key={ay.year_id} value={ay.year_id}>{ay.year_name} {ay.status === 'ACTIVE' ? '(Active)' : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Daily filters */}
            {reportType === 'daily' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Select Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                />
              </div>
            )}

            {/* Date range filters */}
            {reportType === 'range' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="p-2 border rounded-xl outline-none font-bold text-gray-700"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              className="p-2.5 bg-gray-50 border rounded-xl hover:bg-gray-100 text-gray-600 transition"
              title="Refresh Report"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={exportCSV}
              disabled={reportData.length === 0}
              className="px-4 py-2.5 bg-schoolGreen text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center gap-2 shadow-md shadow-schoolGreen/20 disabled:opacity-50"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>
      </Card>

      {/* Report Data Display */}
      <Card className="p-0 overflow-hidden border border-gray-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {reportType === 'class-wise' && (
              <>
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Class Name</th>
                    <th className="py-4 px-6 text-right font-bold text-gray-500 text-[10px] uppercase">Amount Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr><td colSpan="2" className="py-16 text-center italic text-gray-400">Loading reports data...</td></tr>
                  ) : reportData.length === 0 ? (
                    <tr><td colSpan="2" className="py-16 text-center text-gray-400">No collection records found.</td></tr>
                  ) : (
                    reportData.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6 font-bold text-schoolGreen">Class {r.class_name}</td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900">₹{r.collected_amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {reportType === 'term-wise' && (
              <>
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Term</th>
                    <th className="py-4 px-6 text-right font-bold text-gray-500 text-[10px] uppercase">Amount Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr><td colSpan="2" className="py-16 text-center italic text-gray-400">Loading reports data...</td></tr>
                  ) : reportData.length === 0 ? (
                    <tr><td colSpan="2" className="py-16 text-center text-gray-400">No collection records found.</td></tr>
                  ) : (
                    reportData.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6 font-bold text-schoolGreen">{r.term}</td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900">₹{r.collected_amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {reportType === 'year-wise' && (
              <>
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Academic Year</th>
                    <th className="py-4 px-6 text-right font-bold text-gray-500 text-[10px] uppercase">Total Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr><td colSpan="2" className="py-16 text-center italic text-gray-400">Loading reports data...</td></tr>
                  ) : (
                    <tr className="bg-white">
                      <td className="py-6 px-6 font-bold text-schoolGreen">
                        {academicYears.find(y => y.year_id === parseInt(selectedYearId))?.year_name || 'Active Year'}
                      </td>
                      <td className="py-6 px-6 text-right font-black text-2xl text-emerald-700">₹{totalYearlyCollected.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </>
            )}

            {reportType === 'pending' && (
              <>
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Student Name</th>
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Class</th>
                    <th className="py-4 px-6 text-right font-bold text-gray-500 text-[10px] uppercase">Total Due</th>
                    <th className="py-4 px-6 text-right font-bold text-gray-500 text-[10px] uppercase">Paid</th>
                    <th className="py-4 px-6 text-right font-bold text-gray-500 text-[10px] uppercase">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr><td colSpan="5" className="py-16 text-center italic text-gray-400">Loading reports data...</td></tr>
                  ) : reportData.length === 0 ? (
                    <tr><td colSpan="5" className="py-16 text-center text-gray-400">No outstanding accounts.</td></tr>
                  ) : (
                    reportData.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6 font-bold text-gray-800">{r.student_name}</td>
                        <td className="py-4 px-6 text-gray-600 font-semibold">{r.class_name}</td>
                        <td className="py-4 px-6 text-right font-medium text-gray-700">₹{r.total.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-semibold text-green-600">₹{r.paid.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-bold text-red-600">₹{r.balance.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {['daily', 'range'].includes(reportType) && (
              <>
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Receipt No</th>
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Student Name</th>
                    <th className="py-4 px-6 text-right font-bold text-gray-500 text-[10px] uppercase">Amount</th>
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Mode</th>
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Collector</th>
                    <th className="py-4 px-6 text-left font-bold text-gray-500 text-[10px] uppercase">Date/Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr><td colSpan="6" className="py-16 text-center italic text-gray-400">Loading reports data...</td></tr>
                  ) : reportData.length === 0 ? (
                    <tr><td colSpan="6" className="py-16 text-center text-gray-400">No payment logs found for the selection.</td></tr>
                  ) : (
                    reportData.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6 font-bold text-schoolGreen">{r.receipt_no}</td>
                        <td className="py-4 px-6 font-bold text-gray-800">{r.student_name}</td>
                        <td className="py-4 px-6 text-right font-black text-gray-900">₹{r.amount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-xs uppercase font-bold text-gray-500">{r.payment_mode}</td>
                        <td className="py-4 px-6 text-gray-600 font-semibold">{r.collected_by}</td>
                        <td className="py-4 px-6 text-xs text-gray-400">{r.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>
      </Card>
    </div>
  )
}
