import { createContext, useState, useContext, useCallback } from 'react'
import api from '@/config/api'

const DataContext = createContext()

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    fees: { fee_components: [], payment_history: [], total_fee: 0, paid_amount: 0, due_amount: 0, status: 'Pending' },
    marks: [],
    announcements: [],
    notifications: [],
    events: [],
    attendance: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async (class_name = null) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/api/v1/parent/notifications', {
        params: class_name ? { class_name } : {}
      })
      setData(prev => ({ ...prev, notifications: response.data }))
    } catch (err) {
      setError('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFees = async (studentId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/v1/fees/student/${studentId}/summary`)
      const summaryData = response.data
      const due_amount = summaryData.total_balance || 0
      const status = due_amount === 0 ? 'Paid' : 'Pending'
      
      setData(prev => ({ 
        ...prev, 
        fees: {
          ...summaryData,
          due_amount,
          status
        }
      }))
    } catch (err) {
      setError('Failed to fetch fees')
    } finally {
      setLoading(false)
    }
  }

  const fetchMarks = async (student_id, examType = 'Recent') => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/v1/marks/${student_id}`, {
        params: examType ? { exam_type: examType } : {}
      })
      setData(prev => ({ 
        ...prev, 
        marks: response.data.marks || [],
        currentExamType: response.data.exam_type
      }))
    } catch (err) {
      setError('Failed to fetch marks')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/admin/announcements')
      setData(prev => ({ ...prev, announcements: response.data }))
    } catch (err) {
      setError('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/admin/activities')
      setData(prev => ({ ...prev, events: response.data }))
    } catch (err) {
      setError('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async (student_id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/v1/attendance/${student_id}`)
      setData(prev => ({ ...prev, attendance: response.data }))
    } catch (err) {
      setError('Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }

  const value = {
    data,
    loading,
    error,
    fetchFees,
    fetchNotifications,
    fetchMarks,
    fetchAnnouncements,
    fetchEvents,
    fetchAttendance
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
