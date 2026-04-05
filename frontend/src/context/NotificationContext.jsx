import { createContext, useState, useContext, useEffect, useMemo } from 'react'
import { useData } from './DataContext'
import { useSelectedChild } from './SelectedChildContext'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const { data, fetchNotifications } = useData()
  const { selectedChild } = useSelectedChild()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === 'parent' && selectedChild) {
      fetchNotifications(selectedChild.class)
    }
  }, [selectedChild, fetchNotifications, user?.role])

  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('read_notification_ids')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Error parsing notification state:', e)
      return []
    }
  })

  // Sync reachIds to local storage
  useEffect(() => {
    localStorage.setItem('read_notification_ids', JSON.stringify(readIds))
  }, [readIds])

  const notifications = useMemo(() => {
    return data.notifications.map(n => ({
      ...n,
      read: readIds.includes(n.id)
    }))
  }, [data.notifications, readIds])

  const markAsRead = (id) => {
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const markAllAsRead = () => {
    const allIds = data.notifications.map(n => n.id)
    setReadIds(prev => {
      const combined = new Set([...prev, ...allIds])
      return Array.from(combined)
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value = {
    notifications,
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
