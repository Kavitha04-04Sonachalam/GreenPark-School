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
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors duration-200 ${
          isOpen ? 'bg-gray-100 text-schoolGreen' : 'text-schoolGreen hover:bg-gray-50'
        }`}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-schoolYellow text-schoolGreen text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop for mobile to close when clicking outside more easily */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/5 z-[40] md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed md:absolute 
        inset-x-4 md:inset-auto 
        top-[120px] md:top-full md:right-0 
        md:mt-2 md:w-80 
        bg-white border border-gray-200 rounded-xl shadow-2xl 
        z-[100] flex flex-col
        transition-all duration-300 ease-in-out origin-top-right
        ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
      `}>
        <div className="bg-schoolGreen text-white p-4 flex justify-between items-center rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-schoolYellow text-schoolGreen text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium hover:text-schoolYellow transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh] md:max-h-[450px] overscroll-contain custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Bell size={32} />
              </div>
              <p className="text-gray-500 font-medium">No new notifications</p>
              <p className="text-gray-400 text-sm mt-1">We'll notify you when something comes up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id)
                    // setIsOpen(false) // Keep open for better UX? Usually better to keep open
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors relative group ${
                    !notif.read ? 'bg-schoolYellow/5' : ''
                  }`}
                >
                  {!notif.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-schoolGreen"></div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold transition-colors ${
                        !notif.read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notif.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-medium text-gray-400">
                          {(() => {
                            const date = new Date(notif.created_at || notif.date);
                            return isNaN(date.getTime()) ? 'Just now' : formatDistanceToNow(date, { addSuffix: true });
                          })()}
                        </span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-schoolGreen rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50 text-center rounded-b-xl shrink-0">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-schoolGreen font-semibold hover:underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
