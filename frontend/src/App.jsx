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
import MarksPage from './pages/MarksPage'
import ProfilePage from './pages/ProfilePage'
import EventsPage from './pages/EventsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminParents from './pages/admin/AdminParents'
import AdminMarks from './pages/admin/AdminMarks'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminActivities from './pages/admin/AdminActivities'
import NotificationsPage from './pages/NotificationsPage'
import AdminFees from './pages/admin/AdminFees'
import AdminPasswordResets from './pages/admin/AdminPasswordResets'
import SettingsPage from './pages/SettingsPage'

// Layouts
import ParentLayout from './components/layout/ParentLayout'
import AdminLayout from './components/layout/AdminLayout'

function App() {
  return (
    <Router>
      <ErrorProvider>
        <AuthProvider>
          <DataProvider>
            <SelectedChildProvider>
              <NotificationProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Parent Routes */}
                  <Route element={<ParentLayout />}>
                    <Route path="/" element={<ParentDashboard />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/fees" element={<FeesPage />} />

                    <Route path="/marks" element={<MarksPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings/*" element={<SettingsPage />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/students" element={<AdminStudents />} />
                    <Route path="/admin/parents" element={<AdminParents />} />
                    <Route path="/admin/marks" element={<AdminMarks />} />

                    <Route path="/admin/notifications" element={<AdminNotifications />} />
                    <Route path="/admin/activities" element={<AdminActivities />} />
                    <Route path="/admin/fees" element={<AdminFees />} />
                    <Route path="/admin/settings/*" element={<SettingsPage />} />
                    <Route path="/admin/password-resets" element={<AdminPasswordResets />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </NotificationProvider>
            </SelectedChildProvider>
          </DataProvider>
        </AuthProvider>
      </ErrorProvider>
    </Router>
  )
}

export default App
