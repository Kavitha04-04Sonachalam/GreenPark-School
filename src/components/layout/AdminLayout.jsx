import { Navigate, Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ErrorDisplay from '../common/ErrorDisplay'
import { useAuth } from '../../context/AuthContext'
import Loading from '../common/Loading'

export default function AdminLayout() {
  const { user, loading } = useAuth()

  if (loading) return <Loading />

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== 'admin') return <Navigate to="/" replace />

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden relative">
      <Header isAdmin={true} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 pt-[110px] md:pt-[140px]">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ErrorDisplay />
    </div>
  )
}
