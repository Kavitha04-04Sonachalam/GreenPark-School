import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loading from './Loading'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading />
  }

  if (!isAuthenticated || !user) {
    // Derive role based on the path they were trying to access to redirect to the correct login page
    let pathRole = 'parent'
    if (location.pathname.startsWith('/admin')) {
      pathRole = 'admin'
    } else if (location.pathname.startsWith('/student')) {
      pathRole = 'student'
    } else if (location.pathname.startsWith('/staff')) {
      pathRole = 'staff'
    }
    
    return <Navigate to={`/login?role=${pathRole}`} state={{ from: location }} replace />
  }

  // Check if user's role is authorized for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their own home dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    } else if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />
    } else if (user.role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  return children
}
