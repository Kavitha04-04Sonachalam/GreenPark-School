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

  const fetchFees = async (childId) => {
    try {
      setLoading(true)
      setError(null)
      // Mock data - in production, call backend
      const mockFees = [
        { id: '1', type: 'Tuition', amount: 5000, dueDate: '2024-02-28', status: 'Paid', month: 'January 2024' },
        { id: '2', type: 'Transport', amount: 1500, dueDate: '2024-03-05', status: 'Pending', month: 'February 2024' },
        { id: '3', type: 'Activity', amount: 500, dueDate: '2024-03-10', status: 'Pending', month: 'March 2024' }
      ]
      setData(prev => ({ ...prev, fees: mockFees }))
    } catch (err) {
      setError('Failed to fetch fees')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async (childId) => {
    try {
      setLoading(true)
      setError(null)
      const mockAttendance = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        date: new Date(2024, 1, i + 1).toISOString().split('T')[0],
        status: Math.random() > 0.1 ? 'Present' : 'Absent',
        subject: ['Math', 'English', 'Science', 'History'][Math.floor(Math.random() * 4)]
      }))
      setData(prev => ({ ...prev, attendance: mockAttendance }))
    } catch (err) {
      setError('Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }

  const fetchMarks = async (childId) => {
    try {
      setLoading(true)
      setError(null)
      const mockMarks = [
        { id: '1', subject: 'Mathematics', marks: 92, totalMarks: 100, percentage: 92 },
        { id: '2', subject: 'English', marks: 85, totalMarks: 100, percentage: 85 },
        { id: '3', subject: 'Science', marks: 88, totalMarks: 100, percentage: 88 },
        { id: '4', subject: 'History', marks: 79, totalMarks: 100, percentage: 79 },
        { id: '5', subject: 'Geography', marks: 84, totalMarks: 100, percentage: 84 }
      ]
      setData(prev => ({ ...prev, marks: mockMarks }))
    } catch (err) {
      setError('Failed to fetch marks')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
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
