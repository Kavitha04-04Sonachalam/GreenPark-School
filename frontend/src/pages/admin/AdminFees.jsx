import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import { Plus, Edit2, Trash2, X, RefreshCw, Layers } from 'lucide-react'

export default function AdminFees() {
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [activeStructure, setActiveStructure] = useState(null)
  
  // Form states
  const [formClass, setFormClass] = useState('')
  const [formYear, setFormYear] = useState('2024-25')
  const [components, setComponents] = useState([{ component_name: '', amount: 0 }])

  const classesList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'LKG', 'UKG']
  
  const fetchStructures = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/fee-structure`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStructures(data)
      }
    } catch (error) {
      console.error('Failed to fetch fee structures:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStructures()
  }, [])

  const handleEdit = (structure) => {
    setActiveStructure(structure)
    setFormClass(structure.class_name)
    setFormYear(structure.academic_year)
    setComponents(structure.components.length > 0 ? structure.components : [{ component_name: '', amount: 0 }])
    setShowModal(true)
  }

  const handleCreate = () => {
    setActiveStructure(null)
    setFormClass('')
    setFormYear('2024-25')
    setComponents([{ component_name: '', amount: 0 }])
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/fee-structure/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchStructures()
      } else {
        alert('Failed to delete structure')
      }
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleAddComponent = () => {
    setComponents([...components, { component_name: '', amount: 0 }])
  }

  const handleRemoveComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const saveStructure = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      const payload = {
        class_name: formClass,
        academic_year: formYear,
        components: components.filter(c => c.component_name.trim() !== '')
      }
      
      const method = activeStructure ? 'PUT' : 'POST'
      const url = activeStructure 
        ? `${API_BASE_URL}/api/fee-structure/${activeStructure.id}`
        : `${API_BASE_URL}/api/fee-structure`
        
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        setShowModal(false)
        fetchStructures()
      } else {
        const errorData = await response.json()
        alert(`Failed to save: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving structure:', error)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center text-schoolGreen">
        <div>
          <h1 className="text-3xl font-bold mb-2">Class-wise Fee Structure Management</h1>
          <p className="text-gray-600">Configure global fee components mapping for each class</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={fetchStructures}
                className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition text-gray-500 shadow-sm flex items-center justify-center"
                title="Refresh Data"
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-schoolGreen text-white rounded-xl font-bold hover:bg-green-700 transition shadow-sm flex items-center gap-2"
            >
                <Plus size={20} />
                Create Structure
            </button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-0 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 font-bold text-gray-500 uppercase text-[10px]">Class & Year</th>
                <th className="text-left py-4 px-6 font-bold text-gray-500 uppercase text-[10px]">Components</th>
                <th className="text-right py-4 px-6 font-bold text-gray-500 uppercase text-[10px]">Total Amount</th>
                <th className="text-center py-4 px-6 font-bold text-gray-500 uppercase text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center text-gray-400 italic">Loading fee structures...</td></tr>
              ) : structures.length === 0 ? (
                <tr><td colSpan="4" className="py-20 text-center text-gray-400">No fee structures configured yet.</td></tr>
              ) : (
                structures.map((s) => {
                  const total = s.components.reduce((sum, c) => sum + (c.amount || 0), 0)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition duration-150 group">
                        <td className="py-5 px-6">
                            <div className="font-extrabold text-lg text-schoolGreen flex items-center gap-2">
                                <Layers size={18} className="text-schoolGreen/50"/>
                                Class {s.class_name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase font-semibold">Year: {s.academic_year}</div>
                        </td>
                        <td className="py-5 px-6">
                            <div className="flex flex-wrap gap-2">
                                {s.components.map((c, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 font-medium">
                                        {c.component_name} <span className="text-gray-400 ml-1">₹{c.amount}</span>
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td className="py-5 px-6 text-right font-extrabold text-gray-900 text-lg">
                            ₹{total.toLocaleString()}
                        </td>
                        <td className="py-5 px-6 text-center">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEdit(s)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded transition"
                                title="Edit Structure"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(s.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                                title="Delete Structure"
                            >
                                <Trash2 size={18} />
                            </button>
                            </div>
                        </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-schoolGreen p-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">{activeStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}</h3>
                <button onClick={() => setShowModal(false)} className="hover:opacity-75 transition"><X size={24}/></button>
             </div>
             <form onSubmit={saveStructure} className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Class</label>
                        <select 
                            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen transition font-medium"
                            value={formClass}
                            onChange={(e) => setFormClass(e.target.value)}
                            required
                        >
                            <option value="">Select Class</option>
                            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year</label>
                        <input 
                            type="text"
                            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-schoolGreen/20 focus:border-schoolGreen transition font-medium"
                            value={formYear}
                            onChange={(e) => setFormYear(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-bold text-gray-700">Fee Components</label>
                        <button 
                            type="button" 
                            onClick={handleAddComponent}
                            className="text-sm px-3 py-1.5 bg-green-50 text-schoolGreen font-bold rounded-lg hover:bg-green-100 transition flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Component
                        </button>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {components.map((comp, index) => (
                            <div key={index} className="flex gap-3 items-start group">
                                <div className="flex-1">
                                    <input 
                                        type="text"
                                        placeholder="e.g. Tuition Fee"
                                        className="w-full p-3 border border-gray-200 bg-white rounded-lg outline-none focus:border-schoolGreen transition text-sm"
                                        value={comp.component_name}
                                        onChange={(e) => {
                                            const newComps = [...components]
                                            newComps[index].component_name = e.target.value
                                            setComponents(newComps)
                                        }}
                                        required
                                    />
                                </div>
                                <div className="w-1/3">
                                    <input 
                                        type="number"
                                        placeholder="Amount (₹)"
                                        className="w-full p-3 border border-gray-200 bg-white rounded-lg outline-none focus:border-schoolGreen transition text-sm"
                                        value={comp.amount === 0 && !comp.component_name ? '' : comp.amount}
                                        onChange={(e) => {
                                            const newComps = [...components]
                                            newComps[index].amount = parseFloat(e.target.value) || 0
                                            setComponents(newComps)
                                        }}
                                        required
                                    />
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveComponent(index)}
                                    className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        {components.length === 0 && (
                            <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                No components added. Add at least one to continue.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="text-gray-500 font-medium">
                        Total: <span className="text-schoolGreen font-extrabold text-xl ml-1">₹{components.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={components.length === 0}
                            className="px-8 py-2.5 bg-schoolGreen text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {activeStructure ? 'Update Structure' : 'Create Structure'}
                        </button>
                    </div>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}
