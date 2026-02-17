import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { SelectedChildProvider } from './context/SelectedChildContext'
import { NotificationProvider } from './context/NotificationContext'
import { ErrorProvider } from './context/ErrorContext'

// Pages
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ParentDashboard from './pages/ParentDashboard'
import FeesPage from './pages/FeesPage'
import AttendancePage from './pages/AttendancePage'
import MarksPage from './pages/MarksPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminFees from './pages/admin/AdminFees'

// Layouts
import ParentLayout from './components/layout/ParentLayout'
import AdminLayout from './components/layout/AdminLayout'

// Protected route component (can be used if needed)
// const ProtectedRoute = ({ children, requiredRole }) => {
//   const { user } = useAuth()
//   if (!user) return <Navigate to="/login" replace />
//   if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />
//   return children
// }

function App() {
  return (
    <Router>
      <ErrorProvider>
        <AuthProvider>
          <DataProvider>
            <NotificationProvider>
              <SelectedChildProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Parent Routes */}
                  <Route
                    path="/"
                    element={
                      <ParentLayout>
                        <ParentDashboard />
                      </ParentLayout>
                    }
                  />
                  <Route
                    path="/fees"
                    element={
                      <ParentLayout>
                        <FeesPage />
                      </ParentLayout>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <ParentLayout>
                        <AttendancePage />
                      </ParentLayout>
                    }
                  />
                  <Route
                    path="/marks"
                    element={
                      <ParentLayout>
                        <MarksPage />
                      </ParentLayout>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ParentLayout>
                        <ProfilePage />
                      </ParentLayout>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminLayout>
                        <AdminDashboard />
                      </AdminLayout>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminLayout>
                        <AdminUsers />
                      </AdminLayout>
                    }
                  />
                  <Route
                    path="/admin/fees"
                    element={
                      <AdminLayout>
                        <AdminFees />
                      </AdminLayout>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </SelectedChildProvider>
            </NotificationProvider>
          </DataProvider>
        </AuthProvider>
      </ErrorProvider>
    </Router>
  )
}

export default App
