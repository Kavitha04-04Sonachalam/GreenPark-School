import api from '../../config/api'
import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { Users, BookOpen, Layers, Zap, Bell, Calendar, TrendingUp, UserPlus, Filter, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    total_students: 0,
    total_parents: 0,
    total_classes: 0,
    total_activities: 0,
    today_fees_collected: 0,
    month_fees_collected: 0,
    pending_fees_total: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [academicYears, setAcademicYears] = useState([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')

  const classesList = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const sectionsList = ['A', 'B', 'C', 'D']

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await api.get('/api/v1/academic-years')
        setAcademicYears(response.data || [])
        const activeYear = (response.data || []).find(ay => ay.status === 'ACTIVE')
        if (activeYear) {
          setSelectedAcademicYear(activeYear.year_id)
        }
      } catch (error) {
        console.error('Failed to fetch academic years:', error)
      }
    }
    fetchAcademicYears()
  }, [])

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      try {
        const params = {}
        if (selectedClass) params.class_name = selectedClass
        if (selectedSection) params.section = selectedSection
        if (selectedAcademicYear) params.academic_year_id = selectedAcademicYear

        const response = await api.get('/api/v1/admin/dashboard-summary', { params })
        setSummary(response.data)
      } catch (error) {
        console.error('Failed to fetch summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [selectedClass, selectedSection, selectedAcademicYear])

  const [updates, setUpdates] = useState([])
  const [loadingUpdates, setLoadingUpdates] = useState(true)

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await api.get('/api/v1/admin/notifications')
        // Sort by created_at desc or take the first 3
        const sorted = (response.data || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
        setUpdates(sorted)
      } catch (error) {
        console.error('Failed to fetch recent updates:', error)
      } finally {
        setLoadingUpdates(false)
      }
    }
    fetchUpdates()
  }, [])

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    
    const isSameDay = d.getDate() === now.getDate() && 
                      d.getMonth() === now.getMonth() && 
                      d.getFullYear() === now.getFullYear();

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = d.getDate() === yesterday.getDate() && 
                        d.getMonth() === yesterday.getMonth() && 
                        d.getFullYear() === yesterday.getFullYear();
    
    if (isSameDay) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (isYesterday) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }

  const getUpdateMeta = (update) => {
    let dotColor = 'bg-blue-500'
    let author = 'System'
    
    if (update.id === 'mock-1') {
      dotColor = 'bg-blue-500'
      author = 'System'
    } else if (update.id === 'mock-2') {
      dotColor = 'bg-green-500'
      author = 'Server'
    } else if (update.id === 'mock-3') {
      dotColor = 'bg-yellow-500'
      author = 'Finance'
    } else if (update.type === 'ENQUIRY') {
      dotColor = 'bg-amber-500'
      author = 'Enquiry'
    } else if (update.target_type === 'all') {
      dotColor = 'bg-blue-500'
      author = 'System'
    } else {
      dotColor = 'bg-purple-500'
      author = `Class ${update.class_name || ''}`
    }
    
    return { dotColor, author }
  }

  const displayUpdates = updates.length > 0 ? updates : [
    { id: 'mock-1', title: 'Academic session for 2024-25 is live.', target_type: 'all', created_at: new Date().toISOString() },
    { id: 'mock-2', title: 'Data backup completed successfully.', target_type: 'class', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'mock-3', title: 'Fee reminders sent to 45 pending users.', target_type: 'class', created_at: new Date(Date.now() - 172800000).toISOString() }
  ]


  const stats = [
    { label: 'Total Students', value: summary.total_students, icon: BookOpen, color: 'text-blue-605', bg: 'bg-blue-50', link: '/admin/students' },
    { label: 'Total Parents', value: summary.total_parents, icon: Users, color: 'text-indigo-650', bg: 'bg-indigo-50', link: '/admin/parents' },
    { label: "Today's Collection", value: `₹${(summary.today_fees_collected || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-650', bg: 'bg-emerald-50', link: '/admin/fees' },
    { label: "Month's Collection", value: `₹${(summary.month_fees_collected || 0).toLocaleString()}`, icon: DollarSign, color: 'text-teal-650', bg: 'bg-teal-50', link: '/admin/fees' },
    { label: 'Pending Fees', value: `₹${(summary.pending_fees_total || 0).toLocaleString()}`, icon: DollarSign, color: 'text-rose-655', bg: 'bg-rose-50', link: '/admin/fees' }
  ]


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-schoolGreen mb-2">School Overview</h1>
          <p className="text-gray-600">Welcome back, Administrator. Here's what's happening today.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={20} className="text-gray-400" />
            <select 
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-schoolGreen/20 bg-white font-medium"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
            >
              <option value="">All Academic Years</option>
              {academicYears.map(ay => (
                <option key={ay.year_id} value={ay.year_id}>
                  {ay.year_name} {ay.status === 'ACTIVE' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <select 
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-schoolGreen/20 bg-white"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classesList.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <select 
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-schoolGreen/20 bg-white"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">Select Section</option>
              {sectionsList.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 p-1">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Link key={idx} to={stat.link} className="h-full flex flex-col">
              <Card highlight className="hover:scale-[1.02] active:scale-95 transition-all cursor-pointer h-full flex flex-col justify-between">
                <div className="flex items-start justify-between w-full">
                  <div>
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-2.5 tracking-tight">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 ml-4">
                    <Icon className="text-schoolGreen" size={18} />
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-schoolGreen flex items-center gap-2">
            <TrendingUp size={20} /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <Link to="/admin/students">
              <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-schoolYellow/20 hover:border-schoolYellow transition group">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-white transition">
                  <UserPlus size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Add Student</p>
                  <p className="text-xs text-gray-500">Register a new student</p>
                </div>
              </button>
            </Link>
            <Link to="/admin/marks">
              <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition group">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-white transition">
                  <BookOpen size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Enter Marks</p>
                  <p className="text-xs text-gray-500">Upload exam percentages</p>
                </div>
              </button>
            </Link>
            <Link to="/admin/notifications">
              <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-yellow-50 hover:border-yellow-200 transition group">
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-white transition">
                  <Bell size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Post Notification</p>
                  <p className="text-xs text-gray-500">Send alerts to parents</p>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* System Logs / Recent Updates */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-schoolGreen mb-4">Recent Updates</h2>
          <Card>
            <div className="divide-y divide-gray-100">
              {displayUpdates.map((update, index) => {
                const { dotColor, author } = getUpdateMeta(update)
                return (
                  <div key={update.id || index} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex gap-4">
                      <div className={`w-2 h-2 mt-2 rounded-full ${dotColor} flex-shrink-0`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{update.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {author} • {formatTime(update.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

