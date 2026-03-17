import { createContext, useState, useContext } from 'react'

const DataContext = createContext()

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    fees: [],
    attendance: [],
    marks: [],
    announcements: [],
    events: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFees = async (student_id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`http://localhost:8000/api/v1/fees/${student_id}`)
      if (!response.ok) throw new Error('Failed to fetch fees')
      const feesData = await response.json()
      setData(prev => ({ ...prev, fees: feesData }))
    } catch (err) {
      setError('Failed to fetch fees')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async (student_id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`http://localhost:8000/api/v1/attendance/${student_id}`)
      if (!response.ok) throw new Error('Failed to fetch attendance')
      const attendanceData = await response.json()
      setData(prev => ({ ...prev, attendance: attendanceData }))
    } catch (err) {
      setError('Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }

  const fetchMarks = async (student_id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`http://localhost:8000/api/v1/marks/${student_id}`)
      if (!response.ok) throw new Error('Failed to fetch marks')
      const marksData = await response.json()
      // Extract marks list from the wrapper object
      setData(prev => ({ ...prev, marks: marksData.marks || [] }))
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
      const response = await fetch(`http://localhost:8000/api/v1/admin/announcements`, {
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
      const response = await fetch(`http://localhost:8000/api/v1/admin/activities`, {
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
    fetchAttendance,
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
