import { API_BASE_URL } from '@/config'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../../components/common/Loading'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { KeyRound, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminPasswordResets() {
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState('')
    const [resettingId, setResettingId] = useState(null)

    const fetchRequests = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/password-reset-requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) throw new Error('Failed to fetch password reset requests')
            const data = await response.json()
            setRequests(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleResetPassword = async (phoneNumber, requestId) => {
        setResettingId(requestId)
        setError(null)
        setSuccessMsg('')
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/api/v1/admin/reset-parent-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ phone_number: phoneNumber })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.detail || 'Failed to reset password')

            setSuccessMsg(`Password for ${phoneNumber} has been successfully reset to "password123".`)
            // Refresh list to clear resolved requests
            fetchRequests()
        } catch (err) {
            setError(err.message)
        } finally {
            setResettingId(null)
        }
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Password Reset Requests</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage pending password reset requests from parents</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {successMsg && (
                <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg">
                    <CheckCircle size={20} />
                    <p>{successMsg}</p>
                </div>
            )}

            <Card>
                {requests.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No pending requests</h3>
                        <p className="text-gray-500 mt-1">There are currently no password reset requests.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Parent Name</th>
                                    <th className="px-6 py-3">Phone Number</th>
                                    <th className="px-6 py-3">Request Time</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {request.parent_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {request.phone_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(request.request_time).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                disabled={resettingId === request.id}
                                                onClick={() => handleResetPassword(request.phone_number, request.id)}
                                            >
                                                {resettingId === request.id ? 'Resetting...' : 'Reset Default Password'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-blue-50 text-blue-800 text-sm mt-4 rounded-lg">
                            <strong>Note:</strong> Resetting a parent's password changes it to the default value: <code>password123</code>. The parent should be informed to use this to log in, and then change their password on the Settings page immediately.
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
