import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/common/Card'
import { Bell, Plus, Send, X, Calendar, Users, Layers } from 'lucide-react'

export default function AdminNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_type: 'all',
    target_classes: []
  })

  const classesList = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setNotifications(await response.json())
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/notifications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          target_type: formData.target_type,
          target_classes: formData.target_type === 'all' ? [] : formData.target_classes
        })
      })
      if (response.ok) {
        setShowModal(false)
        fetchNotifications()
        setFormData({ title: '', message: '', target_type: 'all', target_classes: [] })
      }
    } catch (error) {
      console.error('Failed to post:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen">Notifications</h1>
          <p className="text-gray-600">Send alerts to parents (Global or Class-based)</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-schoolGreen text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 transition"
        >
          <Plus size={20} /> Create Notification
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-500">No notifications available.</div>
        ) : (
          notifications.map(notif => (
            <Card 
              key={notif.id} 
              className={`border-l-4 ${notif.type === 'ENQUIRY' ? 'border-blue-500 cursor-pointer hover:bg-gray-50' : 'border-schoolYellow'} transition-all`}
              onClick={() => {
                if (notif.type === 'ENQUIRY') {
                  navigate('/admin/admission-enquiries')
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${notif.type === 'ENQUIRY' ? 'bg-amber-100 text-amber-600' : (notif.target_type === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600')}`}>
                  {notif.type === 'ENQUIRY' ? <Bell size={24} /> : (notif.target_type === 'all' ? <Users size={24} /> : <Layers size={24} />)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${notif.target_type === 'all' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {notif.target_type === 'all' ? 'All Parents' : `Class(es) ${notif.class_name?.split(',').join(', ')}`}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{notif.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-2xl animate-in zoom-in duration-300 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
              <h2 className="text-xl font-bold text-schoolGreen">Create Notification</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePost} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Target Type</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                  value={formData.target_type}
                  onChange={(e) => setFormData({...formData, target_type: e.target.value})}
                >
                  <option value="all">All Parents</option>
                  <option value="class">Specific Class</option>
                </select>
              </div>
              
              {formData.target_type === 'class' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Select Classes</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {classesList.map(c => (
                      <label key={c} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                        <input 
                          type="checkbox"
                          className="rounded border-gray-300 text-schoolGreen focus:ring-schoolGreen"
                          checked={formData.target_classes.includes(c)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, target_classes: [...formData.target_classes, c]})
                            } else {
                              setFormData({...formData, target_classes: formData.target_classes.filter(cls => cls !== c)})
                            }
                          }}
                        />
                        <span className="text-sm text-gray-700 font-medium">Class {c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Title</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Holiday Notice"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Enter full message details..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>
              <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-2 flex justify-end gap-3 border-t border-gray-50 z-10">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-schoolGreen text-white font-bold hover:bg-opacity-90 transition flex items-center gap-2"
                >
                  <Send size={20} /> Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
