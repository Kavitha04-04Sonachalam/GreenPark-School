import { createContext, useState, useContext } from 'react'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Fee Payment', message: 'Your fee payment was successful', read: false, date: new Date().toISOString() },
    { id: '2', title: 'Attendance', message: 'Your child has 2 absences this month', read: false, date: new Date(Date.now() - 86400000).toISOString() }
  ])

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      read: false,
      date: new Date().toISOString(),
      ...notification
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
