import { useEffect } from 'react'
import { useSelectedChild } from '../context/SelectedChildContext'
import { useData } from '../context/DataContext'
import Card from '../components/common/Card'
import { LoadingSpinner } from '../components/common/Loading'
import { BookOpen, TrendingUp } from 'lucide-react'
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

  useEffect(() => {
    if (selectedChild) {
      fetchMarks(selectedChild.id)
    }
  }, [selectedChild])

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
      <div>
        <h1 className="text-3xl font-bold text-schoolGreen mb-2">Academic Performance</h1>
        <p className="text-gray-600">{selectedChild?.name} - {selectedChild?.class}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-schoolGreen mt-2">{averagePercentage}%</p>
            </div>
            <TrendingUp className="text-schoolYellow" size={32} />
          </div>
        </Card>

        <Card>
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
        <h2 className="text-xl font-bold text-schoolGreen mb-6">Subject-wise Marks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Marks</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Percentage</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.marks.map(mark => {
                const getGrade = (percentage) => {
                  if (percentage >= 90) return 'A+';
                  if (percentage >= 80) return 'A';
                  if (percentage >= 70) return 'B';
                  if (percentage >= 60) return 'C';
                  return 'D';
                };

                return (
                  <tr key={mark.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{mark.subject}</td>
                    <td className="py-3 px-4 text-right">{mark.marks_obtained}</td>
                    <td className="py-3 px-4 text-right">{mark.total_marks}</td>
                    <td className="py-3 px-4 text-right font-semibold text-schoolGreen">{mark.percentage}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-schoolYellow text-schoolGreen px-3 py-1 rounded-full font-bold text-sm">
                        {getGrade(mark.percentage)}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
