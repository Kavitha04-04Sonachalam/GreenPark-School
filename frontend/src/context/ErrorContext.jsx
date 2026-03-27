import { createContext, useState, useContext } from 'react'

const ErrorContext = createContext()

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([])

  const addError = (error, duration = 5000) => {
    const id = Date.now()
    const errorObj = {
      id,
      message: error.message || error,
      timestamp: new Date()
    }
    setErrors(prev => [...prev, errorObj])

    if (duration > 0) {
      setTimeout(() => removeError(id), duration)
    }
  }

  const removeError = (id) => {
    setErrors(prev => prev.filter(err => err.id !== id))
  }

  const clearErrors = () => {
    setErrors([])
  }

  const value = {
    errors,
    addError,
    removeError,
    clearErrors
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}
