import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-schoolGreen hover:bg-gray-100 rounded-lg transition"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-schoolYellow text-schoolGreen text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-30 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-schoolGreen text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    !notif.read ? 'bg-schoolYellow bg-opacity-10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900">{notif.title}</h4>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-schoolGreen rounded-full mt-1"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
