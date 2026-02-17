import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        setError('Failed to load user data')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call - in production, call your backend
      const mockResponse = {
        user: {
          id: Math.random().toString(),
          email,
          name: email.split('@')[0],
          role: email.includes('admin') ? 'admin' : 'parent',
          children: [
            { id: '1', name: 'Aditya', class: '10th A', rollNo: '15' },
            { id: '2', name: 'Ananya', class: '9th B', rollNo: '22' }
          ]
        },
        token: Math.random().toString(36)
      }

      setUser(mockResponse.user)
      localStorage.setItem('user', JSON.stringify(mockResponse.user))
      localStorage.setItem('token', mockResponse.token)
      
      return mockResponse
    } catch (err) {
      const errorMsg = 'Login failed. Please try again.'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
