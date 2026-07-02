import { createContext, useState, useContext, useCallback, useEffect } from 'react'
import api from '@/config/api'
import { useAuth } from './AuthContext'

const DataContext = createContext()

export const DataProvider = ({ children }) => {
  const { user } = useAuth()
  const [data, setData] = useState({
    fees: { fee_components: [], payment_history: [], total_fee: 0, paid_amount: 0, due_amount: 0, status: 'Pending' },
    marks: [],
    announcements: [],
    notifications: [],
    events: [],
    attendance: [],
    academicYears: []
  })
  
  // Track concurrent loading operations to prevent flashing and race conditions
  const [loadingCount, setLoadingCount] = useState(0)
  const loading = loadingCount > 0

  const startLoading = useCallback(() => setLoadingCount(c => c + 1), [])
  const stopLoading = useCallback(() => setLoadingCount(c => Math.max(0, c - 1)), [])

  const [error, setError] = useState(null)
  
  // Track which API keys have been fetched in the current session
  const [fetchedKeys, setFetchedKeys] = useState({})

  // Clear cache helper (e.g., on logout or role change)
  const clearCache = useCallback(() => {
    setFetchedKeys({})
    setLoadingCount(0)
    setData({
      fees: { fee_components: [], payment_history: [], total_fee: 0, paid_amount: 0, due_amount: 0, status: 'Pending' },
      marks: [],
      announcements: [],
      notifications: [],
      events: [],
      attendance: [],
      academicYears: []
    })
  }, [])

  // Auto-clear cache on logout
  useEffect(() => {
    if (!user) {
      clearCache()
    }
  }, [user, clearCache])

  const fetchNotifications = useCallback(async (class_name = null, force = false) => {
    const cacheKey = `notifications_${class_name || 'all'}`
    if (!force && fetchedKeys[cacheKey]) return;

    try {
      startLoading()
      setError(null)
      const response = await api.get('/api/v1/parent/notifications', {
        params: class_name ? { class_name } : {}
      })
      setData(prev => ({ ...prev, notifications: response.data }))
      setFetchedKeys(prev => ({ ...prev, [cacheKey]: true }))
    } catch (err) {
      setError('Failed to fetch notifications')
    } finally {
      stopLoading()
    }
  }, [fetchedKeys, startLoading, stopLoading])

  const fetchFees = useCallback(async (studentId, force = false) => {
    const cacheKey = `fees_${studentId}`
    if (!force && fetchedKeys[cacheKey]) return;

    try {
      startLoading()
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
      setFetchedKeys(prev => ({ ...prev, [cacheKey]: true }))
    } catch (err) {
      setError('Failed to fetch fees')
    } finally {
      stopLoading()
    }
  }, [fetchedKeys, startLoading, stopLoading])

  const fetchMarks = useCallback(async (student_id, examType = 'Recent', force = false) => {
    const cacheKey = `marks_${student_id}_${examType}`
    if (!force && fetchedKeys[cacheKey]) return;

    try {
      startLoading()
      setError(null)
      const response = await api.get(`/api/v1/marks/${student_id}`, {
        params: examType ? { exam_type: examType } : {}
      })
      setData(prev => ({ 
        ...prev, 
        marks: response.data.marks || [],
        currentExamType: response.data.exam_type
      }))
      setFetchedKeys(prev => ({ ...prev, [cacheKey]: true }))
    } catch (err) {
      setError('Failed to fetch marks')
    } finally {
      stopLoading()
    }
  }, [fetchedKeys, startLoading, stopLoading])

  const fetchAnnouncements = useCallback(async (force = false) => {
    const cacheKey = 'announcements'
    if (!force && fetchedKeys[cacheKey]) return;

    try {
      startLoading()
      const response = await api.get('/api/v1/admin/announcements')
      setData(prev => ({ ...prev, announcements: response.data }))
      setFetchedKeys(prev => ({ ...prev, [cacheKey]: true }))
    } catch (err) {
      setError('Failed to fetch announcements')
    } finally {
      stopLoading()
    }
  }, [fetchedKeys, startLoading, stopLoading])

  const fetchEvents = useCallback(async (force = false) => {
    const cacheKey = 'events'
    if (!force && fetchedKeys[cacheKey]) return;

    try {
      startLoading()
      const response = await api.get('/api/v1/admin/activities')
      setData(prev => ({ ...prev, events: response.data }))
      setFetchedKeys(prev => ({ ...prev, [cacheKey]: true }))
    } catch (err) {
      setError('Failed to fetch events')
    } finally {
      stopLoading()
    }
  }, [fetchedKeys, startLoading, stopLoading])

  const fetchAttendance = useCallback(async (student_id, force = false) => {
    const cacheKey = `attendance_${student_id}`
    if (!force && fetchedKeys[cacheKey]) return;

    try {
      startLoading()
      setError(null)
      const response = await api.get(`/api/v1/attendance/${student_id}`)
      setData(prev => ({ ...prev, attendance: response.data }))
      setFetchedKeys(prev => ({ ...prev, [cacheKey]: true }))
    } catch (err) {
      setError('Failed to fetch attendance')
    } finally {
      stopLoading()
    }
  }, [fetchedKeys, startLoading, stopLoading])

  const fetchAcademicYears = useCallback(async (force = false) => {
    const cacheKey = 'academicYears'
    if (!force && fetchedKeys[cacheKey]) {
      return data.academicYears
    }

    try {
      startLoading()
      const response = await api.get('/api/v1/academic-years')
      const yearsList = response.data || []
      setData(prev => ({ ...prev, academicYears: yearsList }))
      setFetchedKeys(prev => ({ ...prev, [cacheKey]: true }))
      return yearsList
    } catch (err) {
      setError('Failed to fetch academic years')
      return []
    } finally {
      stopLoading()
    }
  }, [fetchedKeys, data.academicYears, startLoading, stopLoading])

  const value = {
    data,
    loading,
    error,
    fetchFees,
    fetchNotifications,
    fetchMarks,
    fetchAnnouncements,
    fetchEvents,
    fetchAttendance,
    fetchAcademicYears,
    clearCache
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
