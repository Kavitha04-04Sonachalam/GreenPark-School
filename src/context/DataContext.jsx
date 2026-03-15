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
      // Mock for now as requested tables didn't include announcements
      const mockAnnouncements = [
        { id: '1', title: 'School Closure', content: 'School will be closed on 8th March', date: '2024-02-20' },
        { id: '2', title: 'Parent-Teacher Meeting', content: 'PTM scheduled for 15th March at 2 PM', date: '2024-02-18' }
      ]
      setData(prev => ({ ...prev, announcements: mockAnnouncements }))
    } catch (err) {
      setError('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      // Mock for now as requested tables didn't include events
      const mockEvents = [
        { id: '1', title: 'Annual Sports Day', date: '2024-03-15', description: 'Sports event for all students' },
        { id: '2', title: 'Science Exhibition', date: '2024-03-22', description: 'Science projects presentation' }
      ]
      setData(prev => ({ ...prev, events: mockEvents }))
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
