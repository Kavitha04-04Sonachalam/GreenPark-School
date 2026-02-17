import { Navigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ErrorDisplay from '../common/ErrorDisplay'
import { useAuth } from '../../context/AuthContext'
import Loading from '../common/Loading'

export default function ParentLayout({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />

  if (!user) return <Navigate to="/login" replace />

  if (user.role === 'admin') return <Navigate to="/admin" replace />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header isAdmin={false} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
      <ErrorDisplay />
    </div>
  )
}
