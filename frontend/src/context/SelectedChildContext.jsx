import { createContext, useState, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '@/config/api'

const SelectedChildContext = createContext()

export const SelectedChildProvider = ({ children }) => {
  const { user, updateUser } = useAuth()
  const [selectedChild, setSelectedChild] = useState(null)
  const [childrenList, setChildrenList] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch children list if it is not already loaded
  useEffect(() => {
    if (user) {
      if (user.role === 'parent' && user.parent_id) {
        if (user.children && user.children.length > 0) {
          setChildrenList(user.children)
        } else {
          const fetchChildren = async () => {
            setLoading(true)
            try {
              const response = await api.get(`/api/v1/students/${user.parent_id}`)
              const mappedChildren = response.data.map(child => ({
                id: String(child.student_id),
                name: `${child.first_name} ${child.last_name}`,
                class: `${child.class_} ${child.section}`,
                rollNo: child.roll_number
              }))
              setChildrenList(mappedChildren)
              updateUser({ children: mappedChildren })
            } catch (error) {
              console.error('Failed to fetch parent children:', error)
            } finally {
              setLoading(false)
            }
          }
          fetchChildren()
        }
      } else {
        setChildrenList([])
      }
    } else {
      setChildrenList([])
      setSelectedChild(null)
    }
  }, [user])

  // Set default selected child when childrenList loads
  useEffect(() => {
    if (childrenList && childrenList.length > 0) {
      const storedChildId = localStorage.getItem('selectedChildId')
      const defaultChild = childrenList.find(c => c.id === storedChildId) || childrenList[0]
      setSelectedChild(defaultChild)
    } else {
      setSelectedChild(null)
    }
  }, [childrenList])

  const switchChild = (childId) => {
    if (childrenList && childrenList.length > 0) {
      const child = childrenList.find(c => c.id === childId)
      if (child) {
        setSelectedChild(child)
        localStorage.setItem('selectedChildId', childId)
      }
    }
  }

  const value = {
    selectedChild,
    switchChild,
    children: childrenList,
    loading
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
