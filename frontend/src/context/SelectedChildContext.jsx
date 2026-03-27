import { createContext, useState, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'

const SelectedChildContext = createContext()

export const SelectedChildProvider = ({ children }) => {
  const { user } = useAuth()
  const [selectedChild, setSelectedChild] = useState(null)

  // Set default selected child when user loads
  useEffect(() => {
    if (user && user.children && user.children.length > 0) {
      const storedChildId = localStorage.getItem('selectedChildId')
      const defaultChild = user.children.find(c => c.id === storedChildId) || user.children[0]
      setSelectedChild(defaultChild)
    }
  }, [user])

  const switchChild = (childId) => {
    if (user && user.children) {
      const child = user.children.find(c => c.id === childId)
      if (child) {
        setSelectedChild(child)
        localStorage.setItem('selectedChildId', childId)
      }
    }
  }

  const value = {
    selectedChild,
    switchChild,
    children: user?.children || []
  }

  return (
    <SelectedChildContext.Provider value={value}>
      {children}
    </SelectedChildContext.Provider>
  )
}

export const useSelectedChild = () => {
  const context = useContext(SelectedChildContext)
  if (!context) {
    throw new Error('useSelectedChild must be used within SelectedChildProvider')
  }
  return context
}
