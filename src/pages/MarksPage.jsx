import { useState, useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { BookOpen, TrendingUp, Calendar, Filter } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts'


export default function MarksPage() {
  const { selectedChild } = useSelectedChild()
  const { data, loading, fetchMarks } = useData()
  const [examType, setExamType] = useState('Recent')

  useEffect(() => {
    if (selectedChild) {
      fetchMarks(selectedChild.id, examType)
    }
  }, [selectedChild, examType])

  if (loading) return <LoadingSpinner />

  const averagePercentage = data.marks.length > 0
    ? Math.round(data.marks.reduce((sum, m) => sum + m.percentage, 0) / data.marks.length)
    : 0

  const chartData = data.marks.length > 0 
    ? data.marks.map(m => ({
        subject: m.subject,
        percentage: m.percentage
      }))
    : [
        { subject: 'Tamil', percentage: 78 },
        { subject: 'English', percentage: 82 },
        { subject: 'Maths', percentage: 95 },
        { subject: 'Science', percentage: 66 },
        { subject: 'Social', percentage: 80 }
      ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-schoolGreen mb-2">Academic Performance</h1>
          <p className="text-gray-600">
            {selectedChild?.name} - {selectedChild?.class} | 
            <span className="ml-2 font-bold text-schoolGreen uppercase tracking-tight">
               {data.currentExamType || examType}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
          <div className="bg-schoolGreen/10 p-2 rounded-lg text-schoolGreen">
            <Filter size={18} />
          </div>
          <select 
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 pr-8 outline-none cursor-pointer"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            <option value="Recent">Recent Exam</option>
            <option value="First Mid Term">First Mid Term</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Second Mid Term">Second Mid Term</option>
            <option value="Half Yearly">Half Yearly</option>
            <option value="Annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">{averagePercentage}%</p>
            </div>
            <TrendingUp className="text-schoolYellow" size={32} />
          </div>
        </Card>

        <Card highlight>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Subjects</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">{data.marks.length}</p>
            </div>
            <BookOpen className="text-schoolYellow" size={32} />
          </div>
        </Card>
      </div>

      {/* Marks Table */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6 flex items-center gap-2">
          <Calendar size={20} /> Subject-wise Performance
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Subject</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Marks</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Total</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Percentage</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.marks.length > 0 ? (
                data.marks.map(mark => (
                  <tr key={mark.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">{mark.subject}</td>
                    <td className="py-3 px-4 text-right font-medium">{mark.marks_obtained}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{mark.total_marks}</td>
                    <td className="py-3 px-4 text-right font-bold text-schoolGreen">{mark.percentage}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block min-w-[40px] bg-schoolYellow/20 text-schoolGreen border border-schoolYellow px-3 py-1 rounded-lg font-black text-xs">
                        {mark.grade}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 italic">
                    No marks available for {examType === 'Recent' ? 'this exam' : examType}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Chart */}
      <Card>
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Performance Overview</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 30, right: 30, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="subject" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4B5563', fontSize: 13 }}
                dy={10}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4B5563', fontSize: 13 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                formatter={(value) => [`${value}%`, 'Percentage']}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#166534"
                strokeWidth={4}
                dot={{ r: 6, fill: '#166534', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, fill: '#166534', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1500}
              >
                <LabelList 
                  dataKey="percentage" 
                  position="top" 
                  offset={15} 
                  formatter={(val) => `${val}%`}
                  style={{ fill: '#166534', fontWeight: 'bold', fontSize: '14px' }} 
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
