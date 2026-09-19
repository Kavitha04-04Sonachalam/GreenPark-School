import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../config/api'

export default function SyncStatusBadge() {
  const isCloudMode = 
    import.meta.env.VITE_APP_ENV === 'cloud' || 
    (typeof window !== 'undefined' && (
      window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('onrender.com')
    ))

  const [status, setStatus] = useState({
    is_online: true,
    is_cloud: isCloudMode,
    total_pending: 0,
    total_failed: 0,
    last_synced_at: null
  })
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchStatus = async () => {
    if (isCloudMode) {
      setStatus({
        is_online: true,
        is_cloud: true,
        total_pending: 0,
        total_failed: 0,
        last_synced_at: new Date().toISOString()
      })
      return
    }

    try {
      const response = await api.get('/api/v1/sync/status')
      setStatus(response.data)
    } catch (err) {
      // If 404 or running against cloud server, remain online in cloud mode
      if (err.response?.status === 404) {
        setStatus({
          is_online: true,
          is_cloud: true,
          total_pending: 0,
          total_failed: 0,
          last_synced_at: null
        })
      } else {
        // Local offline
        setStatus(prev => ({ ...prev, is_online: false }))
      }
    }
  }

  useEffect(() => {
    fetchStatus()
    if (!isCloudMode) {
      const interval = setInterval(fetchStatus, 30000) // Poll status every 30s only on local LAN
      return () => clearInterval(interval)
    }
  }, [isCloudMode])

  const handleSyncNow = async () => {
    setLoading(true)
    try {
      await api.post('/api/v1/sync/trigger')
      await fetchStatus()
    } catch (err) {
      console.error('Manual sync failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatLastSync = (isoStr) => {
    if (!isoStr) return 'Never'
    try {
      const d = new Date(isoStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition shadow-sm ${
          status.is_online
            ? status.total_pending > 0
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
        }`}
        title="Database Synchronization Status"
      >
        {status.is_online ? (
          status.total_pending > 0 ? (
            <>
              <RefreshCw size={13} className="text-amber-600 animate-spin" />
              <span className="hidden sm:inline">{status.total_pending} Pending</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Synced</span>
            </>
          )
        ) : (
          <>
            <WifiOff size={13} className="text-rose-600" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {status.is_online ? (
                <Wifi size={16} className="text-emerald-600" />
              ) : (
                <WifiOff size={16} className="text-rose-600" />
              )}
              <span className="font-bold text-sm">
                {status.is_cloud 
                  ? 'Cloud Online' 
                  : (status.is_online ? 'Cloud Connected' : 'Working Offline (LAN)')}
              </span>
            </div>
            <span className={`w-2 h-2 rounded-full ${status.is_online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>

          {status.is_cloud ? (
            <div className="py-3 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> Live Central Database
              </p>
              <p className="text-gray-500">
                You are accessing the hosted cloud portal. All changes and entries are saved live directly to Cloud Neon.
              </p>
            </div>
          ) : (
            <>
              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Last Synced:</span>
                  <span className="font-semibold text-gray-900">{formatLastSync(status.last_synced_at)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Local Pending Records:</span>
                  <span className={`font-semibold ${status.total_pending > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {status.total_pending}
                  </span>
                </div>
                {status.total_failed > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Failed Attempts:</span>
                    <span className="font-semibold">{status.total_failed}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSyncNow}
                disabled={loading || !status.is_online}
                className="w-full mt-2 py-2 px-3 bg-schoolGreen text-white text-xs font-semibold rounded-lg hover:bg-opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Syncing...' : 'Sync with Cloud Now'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
