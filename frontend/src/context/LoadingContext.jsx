import { createContext, useState, useEffect, useContext, useCallback } from 'react'
import api from '../config/api'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const LoadingContext = createContext()

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Loading...')
  const [retryState, setRetryState] = useState({
    show: false,
    message: '',
    onRetry: null,
    onCancel: null
  })

  const showLoading = useCallback((msg = 'Loading...') => {
    setMessage(msg)
    setLoading(true)
  }, [])

  const hideLoading = useCallback(() => {
    setLoading(false)
  }, [])

  const withLoading = useCallback(async (asyncFn, msg = 'Processing...') => {
    showLoading(msg)
    try {
      return await asyncFn()
    } finally {
      hideLoading()
    }
  }, [showLoading, hideLoading])

  // Setup Axios interceptors
  useEffect(() => {
    let activeRequests = 0

    const reqInterceptor = api.interceptors.request.use(
      (config) => {
        if (!config.skipLoading) {
          activeRequests++
          showLoading(config.loadingMessage || 'Loading...')
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    const resInterceptor = api.interceptors.response.use(
      (response) => {
        if (!response.config.skipLoading) {
          activeRequests--
          if (activeRequests <= 0) {
            activeRequests = 0
            hideLoading()
          }
        }
        return response
      },
      (error) => {
        if (!error.config || !error.config.skipLoading) {
          activeRequests--
          if (activeRequests <= 0) {
            activeRequests = 0
            hideLoading()
          }
        }

        const config = error.config
        // Don't retry if it was already retried, if skipRetry is set, or if it is a 401/403/422 validation error
        if (
          !config || 
          config._isRetry || 
          config.skipRetry || 
          (error.response && [401, 403, 422].includes(error.response.status))
        ) {
          return Promise.reject(error)
        }

        // Return a Promise that will be resolved/rejected by user selection
        return new Promise((resolve, reject) => {
          setRetryState({
            show: true,
            message: error.response?.data?.detail || error.message || 'An error occurred while processing your request.',
            onRetry: () => {
              setRetryState(prev => ({ ...prev, show: false }))
              config._isRetry = true
              // Re-run request
              resolve(api(config))
            },
            onCancel: () => {
              setRetryState(prev => ({ ...prev, show: false }))
              reject(error)
            }
          })
        })
      }
    )

    return () => {
      api.interceptors.request.eject(reqInterceptor)
      api.interceptors.response.eject(resInterceptor)
    }
  }, [showLoading, hideLoading])

  return (
    <LoadingContext.Provider value={{ loading, message, showLoading, hideLoading, withLoading }}>
      {children}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="relative flex items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-white/20 border-t-schoolGreen border-r-schoolYellow"></div>
          </div>
          <p className="mt-4 text-white font-extrabold text-[11px] uppercase tracking-widest text-center select-none animate-pulse">{message}</p>
        </div>
      )}

      {/* Retry Dialog */}
      {retryState.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-650 mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-extrabold text-gray-900 text-lg">Request Failed</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{retryState.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={retryState.onCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button 
                onClick={retryState.onRetry}
                className="px-5 py-2 bg-schoolGreen hover:bg-opacity-95 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}
