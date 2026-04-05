import { createContext, useState, useContext, useCallback } from 'react'
import { API_BASE_URL } from '@/config'

const DataContext = createContext()

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    fees: { fee_components: [], payment_history: [], total_fee: 0, paid_amount: 0, due_amount: 0, status: 'Pending' },
    marks: [],
    announcements: [],
    notifications: [],
    events: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNotifications = useCallback(async (class_name = null) => {
    try {
      setLoading(true)
      setError(null)
      let url = `${API_BASE_URL}/api/v1/parent/notifications`
      if (class_name) {
        url += `?class_name=${class_name}`
      }
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch notifications')
      const notificationsData = await response.json()
      setData(prev => ({ ...prev, notifications: notificationsData }))
    } catch (err) {
      setError('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFees = async (class_name) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/fee-structure/${class_name}`)
      if (!response.ok) throw new Error('Failed to fetch fees')
      const feesData = await response.json()
      setData(prev => ({ ...prev, fees: feesData }))
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
      const url = examType 
        ? `${API_BASE_URL}/api/v1/marks/${student_id}?exam_type=${examType}`
        : `${API_BASE_URL}/api/v1/marks/${student_id}`
        
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch marks')
      const marksData = await response.json()
      // Extract marks list from the wrapper object
      setData(prev => ({ 
        ...prev, 
        marks: marksData.marks || [],
        currentExamType: marksData.exam_type
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
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/announcements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch announcements')
      const announcementsData = await response.json()
      setData(prev => ({ ...prev, announcements: announcementsData }))
    } catch (err) {
      setError('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch events')
      const eventsData = await response.json()
      setData(prev => ({ ...prev, events: eventsData }))
    } catch (err) {
      setError('Failed to fetch events')
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
    fetchEvents
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
