import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { Plus, X, Calendar, MapPin, Trash2, Camera } from 'lucide-react'

export default function AdminActivities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    image_url: ''
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setActivities(await response.json())
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/activities`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setShowModal(false)
        fetchActivities()
        setFormData({ title: '', description: '', event_date: '', image_url: '' })
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) fetchActivities()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen">School Activities & Events</h1>
          <p className="text-gray-600">Manage and showcase school events to parents</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-schoolGreen text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 transition"
        >
          <Plus size={20} /> Add New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400">Loading events...</div>
        ) : activities.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-300 italic">No activities planned yet.</div>
        ) : (
          activities.map(act => (
            <Card key={act.id} className="p-0 overflow-hidden flex flex-col h-full group">
              <div className="h-48 bg-gray-100 relative group-hover:scale-95 transition-transform overflow-hidden duration-500">
                {act.image_url ? (
                  <img src={act.image_url} alt={act.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Camera size={48} />
                  </div>
                )}
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition translate-x-10 group-hover:translate-x-0 duration-300">
                  <button 
                    onClick={() => handleDelete(act.id)}
                    className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-schoolGreen text-xs font-bold mb-3 uppercase tracking-wider">
                  <Calendar size={14} /> {new Date(act.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{act.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">{act.description}</p>
                <div className="mt-auto flex items-center text-xs text-gray-400 gap-1">
                  <MapPin size={12} /> Green Park School Campus
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-schoolGreen">Add New School Activity</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Event Title</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Science Exhibition 2024"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Event Image</label>
                  <div className="flex items-center gap-4">
                    {formData.image_url ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image_url: ''})}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg hover:bg-red-600 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                        <Camera size={24} />
                        <span className="text-[10px] mt-1">No Image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="activity-image-upload"
                        onChange={async (e) => {
                          const file = e.target.files[0]
                          if (!file) return
                          
                          try {
                            const uploadFormData = new FormData()
                            uploadFormData.append('image', file)
                            
                            const token = localStorage.getItem('token')
                            const response = await fetch(`${API_BASE_URL}/api/v1/admin/activities/upload-image`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` },
                              body: uploadFormData
                            })
                            
                            if (response.ok) {
                              const data = await response.json()
                              setFormData({...formData, image_url: data.url})
                            } else {
                              alert('Failed to upload image')
                            }
                          } catch (error) {
                            console.error('Upload error:', error)
                            alert('Upload error')
                          }
                        }}
                      />
                      <label 
                        htmlFor="activity-image-upload"
                        className="inline-block px-4 py-2 bg-white border border-schoolGreen text-schoolGreen rounded-lg text-sm font-bold cursor-pointer hover:bg-schoolGreen hover:text-white transition"
                      >
                        {formData.image_url ? 'Change Image' : 'Upload Image'}
                      </label>
                      <p className="text-[10px] text-gray-400 mt-2">Recommended: 800x400px or 2:1 aspect ratio</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Describe the event details..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-schoolGreen/20 focus:outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-schoolGreen text-white font-bold hover:bg-opacity-90 transition shadow-lg shadow-schoolGreen/20"
                >
                  Publish Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
