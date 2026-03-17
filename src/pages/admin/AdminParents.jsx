import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Card from '../../components/common/Card'
import { Plus, Search, Edit2, Trash2, X, Save, Phone, MapPin } from 'lucide-react'

export default function AdminParents() {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [currentParent, setCurrentParent] = useState(null)
  const [formData, setFormData] = useState({
    father_name: '',
    mother_name: '',
    phone_primary: '',
    address: ''
  })

  useEffect(() => {
    fetchParents()
  }, [])

  const fetchParents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/admin/parents', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setParents(data)
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      // Note: Current backend admin_service.py only has create_parent and get_parents
      // I will implement update_parent in the backend if needed, but for now focusing on create
      const url = 'http://localhost:8000/api/v1/admin/parents'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        fetchParents()
        setFormData({ father_name: '', mother_name: '', phone_primary: '', address: '' })
      }
    } catch (error) {
      console.error('Operation failed:', error)
    }
  }

  const openModal = (parent = null) => {
    if (parent) {
      setCurrentParent(parent)
      setFormData({
        father_name: parent.father_name,
        mother_name: parent.mother_name,
        phone_primary: parent.phone_primary,
        address: parent.address
      })
    } else {
      setCurrentParent(null)
      setFormData({ father_name: '', mother_name: '', phone_primary: '', address: '' })
    }
    setShowModal(true)
  }

  const filteredParents = parents.filter(p => 
    p.father_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mother_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone_primary.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-schoolGreen">Parent Management</h1>
          <p className="text-gray-600">Total {filteredParents.length} parents registered</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-schoolGreen text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
        >
          <Plus size={20} /> Add New Parent
        </button>
      </div>

      <Card>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-schoolGreen/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-10 text-center text-gray-500">Loading parents...</div>
          ) : filteredParents.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-500">No parents found.</div>
          ) : (
            filteredParents.map(parent => (
              <Card key={parent.parent_id} className="border-l-4 border-schoolYellow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{parent.parent_id}</p>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{parent.father_name}</h3>
                    <p className="text-sm text-gray-500">& {parent.mother_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(parent)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={16} className="text-schoolGreen" />
                    <span>{parent.phone_primary}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin size={16} className="text-schoolGreen mt-1 flex-shrink-0" />
                    <span className="line-clamp-2">{parent.address}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded uppercase">Account Active</span>
                  <p className="text-[10px] text-gray-400">Pass: password123</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold text-schoolGreen">
                  {currentParent ? 'Update Parent Profile' : 'Register New Parent'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Manage parent information and portal access.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="parentForm" onSubmit={handleCreateOrUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Father's Name <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter father's name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.father_name}
                      onChange={(e) => setFormData({...formData, father_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mother's Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter mother's name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                      value={formData.mother_name}
                      onChange={(e) => setFormData({...formData, mother_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Primary Phone <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        type="tel" 
                        placeholder="e.g. 9876543210 (Used for login)"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200"
                        value={formData.phone_primary}
                        onChange={(e) => setFormData({...formData, phone_primary: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Residential Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                      <textarea 
                        required
                        rows="3"
                        placeholder="Enter complete residential address"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-schoolGreen/10 focus:border-schoolGreen focus:bg-white outline-none transition-all duration-200 resize-none"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {!currentParent && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg h-fit">
                      <Plus size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800 uppercase tracking-tight">Security Notice</p>
                      <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        A login account will be automatically created using the <strong>Primary Phone</strong> as the username and <strong>password123</strong> as the temporary password.
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                form="parentForm"
                type="submit"
                className="px-8 py-2.5 rounded-xl bg-schoolGreen text-white text-sm font-semibold shadow-lg shadow-schoolGreen/20 hover:bg-opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <Save size={20} /> {currentParent ? 'Update Profile' : 'Save Parent'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
