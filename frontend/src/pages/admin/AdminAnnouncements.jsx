import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { Bell, Plus, Send, X, Trash2, Calendar } from 'lucide-react'

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'General'
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/announcements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setAnnouncements(await response.json())
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
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/announcements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setShowModal(false)
        fetchAnnouncements()
        setFormData({ title: '', message: '', category: 'General' })
      }
    } catch (error) {
      console.error('Failed to post:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen">Announcements</h1>
          <p className="text-gray-600">Broadcast important notices to all parents</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-schoolGreen text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 transition"
        >
          <Plus size={20} /> Create New Notice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-500">Loading notices...</div>
        ) : announcements.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-500">No announcements posted yet.</div>
        ) : (
          announcements.map(ann => (
            <Card key={ann.id} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-schoolYellow/20 text-schoolGreen rounded-xl shrink-0">
                  <Bell size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full uppercase tracking-tighter">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{ann.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{ann.message}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-schoolGreen">New Announcement</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePost} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Category</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="General">General Notice</option>
                  <option value="Holiday">Holiday Alert</option>
                  <option value="Exam">Exam Update</option>
                  <option value="Event">Event RSVP</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Notice Title</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Message Content</label>
                <textarea 
                  required
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>
              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-schoolGreen text-white font-bold hover:bg-opacity-90 transition flex items-center gap-2"
                >
                  <Send size={20} /> Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
