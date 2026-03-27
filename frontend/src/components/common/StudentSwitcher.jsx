import { useState } from 'react'
import { useSelectedChild } from '../../context/SelectedChildContext'
import { ChevronDown } from 'lucide-react'

export default function StudentSwitcher() {
  const { selectedChild, switchChild, children } = useSelectedChild()
  const [isOpen, setIsOpen] = useState(false)

  if (!children || children.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-schoolGreen text-schoolGreen font-medium"
      >
        <span className="text-sm">{selectedChild?.name || 'Select Child'}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => {
                switchChild(child.id)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 hover:bg-schoolYellow ${
                selectedChild?.id === child.id ? 'bg-schoolYellow text-schoolGreen font-medium' : 'text-gray-700'
              } first:rounded-t-lg last:rounded-b-lg`}
            >
              <div className="font-medium">{child.name}</div>
              <div className="text-xs text-gray-500">{child.class} - Roll No: {child.rollNo}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
