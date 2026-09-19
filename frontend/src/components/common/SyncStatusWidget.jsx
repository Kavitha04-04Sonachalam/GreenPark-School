import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import api from '../../config/api';

export default function SyncStatusWidget() {
  const [syncData, setSyncData] = useState({
    is_online: true,
    last_synced_at: null,
    total_pending: 0,
    total_failed: 0,
    breakdown: {
      pending_marks: 0,
      pending_attendance: 0,
      pending_fee_payments: 0,
      failed_marks: 0,
      failed_attendance: 0,
      failed_fee_payments: 0
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const popoverRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/api/v1/sync/status');
      if (res.data) {
        setSyncData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch sync status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLastMessage(null);
    try {
      const res = await api.post('/api/v1/sync/trigger');
      if (res.data.success) {
        setLastMessage({ type: 'success', text: 'Sync cycle completed successfully!' });
      } else {
        setLastMessage({ type: 'error', text: res.data.message || 'Sync failed.' });
      }
      await fetchStatus();
    } catch (err) {
      setLastMessage({ type: 'error', text: 'Failed to communicate with sync service.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  };

  const { is_online, total_pending, total_failed, last_synced_at, breakdown } = syncData;

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Trigger Button / Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition border ${
          !is_online
            ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
            : total_pending > 0
            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
            : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
        }`}
        title="Click to view sync status & cloud synchronization"
      >
        {isSyncing ? (
          <RefreshCw size={14} className="animate-spin text-blue-600" />
        ) : !is_online ? (
          <CloudOff size={14} className="text-amber-600" />
        ) : total_pending > 0 ? (
          <RefreshCw size={14} className="text-blue-600" />
        ) : (
          <Cloud size={14} className="text-emerald-600" />
        )}

        <span className="hidden sm:inline">
          {isSyncing
            ? 'Syncing...'
            : !is_online
            ? 'Offline'
            : total_pending > 0
            ? `${total_pending} Pending`
            : 'LAN Synced'}
        </span>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Cloud Sync Status</h4>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                is_online ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${is_online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {is_online ? 'Internet Connected' : 'No Internet'}
            </span>
          </div>

          {/* Sync Stats Info */}
          <div className="space-y-2 text-xs text-gray-600 mb-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Clock size={13} /> Last Cloud Sync:
              </span>
              <span className="font-semibold text-gray-800">{formatLastSync(last_synced_at)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-gray-500">
                <RefreshCw size={13} /> Pending Changes:
              </span>
              <span className={`font-semibold ${total_pending > 0 ? 'text-blue-600' : 'text-gray-800'}`}>
                {total_pending} records
              </span>
            </div>
            {total_failed > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span className="flex items-center gap-1.5">
                  <AlertCircle size={13} /> Failed Attempts:
                </span>
                <span className="font-semibold">{total_failed}</span>
              </div>
            )}
          </div>

          {/* Breakdown Pills */}
          {total_pending > 0 && (
            <div className="bg-gray-50 rounded-lg p-2.5 mb-3 text-[11px] text-gray-600 space-y-1">
              <div className="font-semibold text-gray-700 mb-1">Pending Sync Queue:</div>
              {breakdown?.pending_marks > 0 && (
                <div className="flex justify-between">
                  <span>Marks</span>
                  <span className="font-medium text-gray-800">{breakdown.pending_marks}</span>
                </div>
              )}
              {breakdown?.pending_attendance > 0 && (
                <div className="flex justify-between">
                  <span>Attendance</span>
                  <span className="font-medium text-gray-800">{breakdown.pending_attendance}</span>
                </div>
              )}
              {breakdown?.pending_fee_payments > 0 && (
                <div className="flex justify-between">
                  <span>Fee Payments</span>
                  <span className="font-medium text-gray-800">{breakdown.pending_fee_payments}</span>
                </div>
              )}
            </div>
          )}

          {lastMessage && (
            <div
              className={`p-2 rounded-lg text-xs mb-3 ${
                lastMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {lastMessage.text}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 transition ${
              isSyncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-schoolGreen hover:bg-emerald-800 shadow-sm'
            }`}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Synchronizing with Neon...' : 'Sync Now'}
          </button>
        </div>
      )}
    </div>
  );
}
