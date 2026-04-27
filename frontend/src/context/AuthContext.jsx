import { createContext, useState, useContext, useEffect } from 'react'
import api from '@/config/api'

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

  const login = async (phoneNumber, password, role) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.post('/api/v1/login', {
        phone_number: phoneNumber,
        password: password,
        role: role
      })

      const data = response.data

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.access_token)

      return data
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Login failed. Please try again.'
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
