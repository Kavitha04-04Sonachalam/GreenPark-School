import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { SelectedChildProvider } from './context/SelectedChildContext'
import { NotificationProvider } from './context/NotificationContext'
import { ErrorProvider } from './context/ErrorContext'
import { LoadingProvider } from './context/LoadingContext'
import { getRoleFromPort, getPortForRole, redirectToPort } from './lib/portHelper'

// Pages
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AdmissionEnquiryPage from './pages/AdmissionEnquiryPage'
import ParentDashboard from './pages/ParentDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StaffDashboard from './pages/StaffDashboard'
import AttendancePage from './pages/AttendancePage'
import FeesPage from './pages/FeesPage'
import StudentFeesPage from './pages/StudentFeesPage'
import MarksPage from './pages/MarksPage'
import ProfilePage from './pages/ProfilePage'
import EventsPage from './pages/EventsPage'
import ContactUsPage from './pages/ContactUsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminStudentPromotion from './pages/admin/AdminStudentPromotion'
import AdminParents from './pages/admin/AdminParents'
import AdminStaff from './pages/admin/AdminStaff'
import AdminMarks from './pages/admin/AdminMarks'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminActivities from './pages/admin/AdminActivities'
import NotificationsPage from './pages/NotificationsPage'
import AdminFees from './pages/admin/AdminFees'
import AdminReports from './pages/admin/AdminReports'
import AdminPasswordResets from './pages/admin/AdminPasswordResets'
import AdminAdmissionEnquiries from './pages/admin/AdminAdmissionEnquiries'
import SettingsPage from './pages/SettingsPage'
import GalleryPage from './pages/GalleryPage'
import EventDetailsPage from './pages/EventDetailsPage'
import AdminGalleryPage from './pages/admin/AdminGalleryPage'
import AdminCreateEventPage from './pages/admin/AdminCreateEventPage'
import AdminUploadMediaPage from './pages/admin/AdminUploadMediaPage'

// Layouts & Protection
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

// Home redirect based on role
function HomeRedirect() {
  const { user } = useAuth()
  if (!user) {
    const portRole = getRoleFromPort()
    return <Navigate to={`/login?role=${portRole}`} replace />
  }
  
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
  if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />
  
  return <ParentDashboard />
}

function App() {
  return (
    <Router>
      <LoadingProvider>
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
                  <Route path="/admission-enquiry" element={<AdmissionEnquiryPage />} />

                  {/* Unified Dashboard Layout with Role-Based Route Protection */}
                  
                  {/* Parent Routes */}
                  <Route element={
                    <ProtectedRoute allowedRoles={['parent']}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/announcements" element={<NotificationsPage />} />
                    <Route path="/contact-us" element={<ContactUsPage />} />
                    <Route path="/fees" element={<FeesPage />} />
                    <Route path="/marks" element={<MarksPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/gallery/:event_id" element={<EventDetailsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings/*" element={<SettingsPage />} />
                  </Route>

                  {/* Student Routes */}
                  <Route element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/attendance" element={<AttendancePage />} />
                    <Route path="/student/marks" element={<MarksPage />} />
                    <Route path="/student/announcements" element={<NotificationsPage />} />
                    <Route path="/student/profile" element={<ProfilePage />} />
                    <Route path="/student/fees" element={<StudentFeesPage />} />
                  </Route>

                  {/* Staff Routes */}
                  <Route element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/staff/dashboard" element={<StaffDashboard />} />
                    <Route path="/staff/students" element={<AdminStudents />} />
                    <Route path="/staff/attendance" element={<AttendancePage />} />
                    <Route path="/staff/announcements" element={<NotificationsPage />} />
                    <Route path="/staff/profile" element={<ProfilePage />} />
                    <Route path="/staff/fees" element={<AdminFees />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/students" element={<AdminStudents />} />
                    <Route path="/admin/students/promote" element={<AdminStudentPromotion />} />
                    <Route path="/admin/parents" element={<AdminParents />} />
                    <Route path="/admin/staff" element={<AdminStaff />} />
                    <Route path="/admin/attendance" element={<AttendancePage />} />
                    <Route path="/admin/marks" element={<AdminMarks />} />
                    <Route path="/admin/notifications" element={<AdminNotifications />} />
                    <Route path="/admin/announcements" element={<AdminNotifications />} />
                    <Route path="/admin/activities" element={<AdminActivities />} />
                    <Route path="/admin/gallery" element={<AdminGalleryPage />} />
                    <Route path="/admin/gallery/:event_id" element={<EventDetailsPage />} />
                    <Route path="/admin/gallery/create" element={<AdminCreateEventPage />} />
                    <Route path="/admin/gallery/:event_id/upload" element={<AdminUploadMediaPage />} />
                    <Route path="/admin/fees" element={<AdminFees />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/users" element={<AdminPasswordResets />} />
                    <Route path="/admin/settings/*" element={<SettingsPage />} />
                    <Route path="/admin/password-resets" element={<AdminPasswordResets />} />
                    <Route path="/admin/admission-enquiries" element={<AdminAdmissionEnquiries />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </NotificationProvider>
            </SelectedChildProvider>
          </DataProvider>
        </AuthProvider>
      </ErrorProvider>
      </LoadingProvider>
    </Router>
  )
}

export default App
