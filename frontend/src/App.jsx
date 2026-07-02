import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { SelectedChildProvider } from './context/SelectedChildContext'
import { NotificationProvider } from './context/NotificationContext'
import { ErrorProvider } from './context/ErrorContext'
import { LoadingProvider } from './context/LoadingContext'
import { getRoleFromPort, getPortForRole, redirectToPort } from './lib/portHelper'
import Loading from './components/common/Loading'

// Lazy loaded Pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const AdmissionEnquiryPage = lazy(() => import('./pages/AdmissionEnquiryPage'))
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'))
const AttendancePage = lazy(() => import('./pages/AttendancePage'))
const FeesPage = lazy(() => import('./pages/FeesPage'))
const StudentFeesPage = lazy(() => import('./pages/StudentFeesPage'))
const MarksPage = lazy(() => import('./pages/MarksPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'))
const AdminStudentPromotion = lazy(() => import('./pages/admin/AdminStudentPromotion'))
const AdminParents = lazy(() => import('./pages/admin/AdminParents'))
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'))
const AdminMarks = lazy(() => import('./pages/admin/AdminMarks'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'))
const AdminActivities = lazy(() => import('./pages/admin/AdminActivities'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const AdminFees = lazy(() => import('./pages/admin/AdminFees'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminPasswordResets = lazy(() => import('./pages/admin/AdminPasswordResets'))
const AdminAdmissionEnquiries = lazy(() => import('./pages/admin/AdminAdmissionEnquiries'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'))
const AdminGalleryPage = lazy(() => import('./pages/admin/AdminGalleryPage'))
const AdminCreateEventPage = lazy(() => import('./pages/admin/AdminCreateEventPage'))
const AdminUploadMediaPage = lazy(() => import('./pages/admin/AdminUploadMediaPage'))

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
                <Suspense fallback={<Loading message="Loading Page..." />}>
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
                      <Route path="/student/notifications" element={<NotificationsPage />} />
                      <Route path="/student/announcements" element={<NotificationsPage />} />
                      <Route path="/student/fees" element={<StudentFeesPage />} />
                      <Route path="/student/marks" element={<MarksPage />} />
                      <Route path="/student/events" element={<EventsPage />} />
                      <Route path="/student/gallery" element={<GalleryPage />} />
                      <Route path="/student/gallery/:event_id" element={<EventDetailsPage />} />
                      <Route path="/student/profile" element={<ProfilePage />} />
                      <Route path="/student/settings/*" element={<SettingsPage />} />
                    </Route>

                    {/* Staff Routes */}
                    <Route element={
                      <ProtectedRoute allowedRoles={['staff']}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }>
                      <Route path="/staff/dashboard" element={<StaffDashboard />} />
                      <Route path="/staff/students" element={<AdminStudents />} />
                      <Route path="/staff/marks" element={<AdminMarks />} />
                      <Route path="/staff/attendance" element={<AttendancePage />} />
                      <Route path="/staff/notifications" element={<NotificationsPage />} />
                      <Route path="/staff/announcements" element={<NotificationsPage />} />
                      <Route path="/staff/events" element={<EventsPage />} />
                      <Route path="/staff/gallery" element={<GalleryPage />} />
                      <Route path="/staff/gallery/:event_id" element={<EventDetailsPage />} />
                      <Route path="/staff/profile" element={<ProfilePage />} />
                      <Route path="/staff/settings/*" element={<SettingsPage />} />
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
                      <Route path="/admin/marks" element={<AdminMarks />} />
                      <Route path="/admin/notifications" element={<AdminNotifications />} />
                      <Route path="/admin/gallery" element={<AdminGalleryPage />} />
                      <Route path="/admin/gallery/create-event" element={<AdminCreateEventPage />} />
                      <Route path="/admin/gallery/upload" element={<AdminUploadMediaPage />} />
                      <Route path="/admin/announcements" element={<AdminNotifications />} />
                      <Route path="/admin/fees" element={<AdminFees />} />
                      <Route path="/admin/reports" element={<AdminReports />} />
                      <Route path="/admin/users" element={<AdminPasswordResets />} />
                      <Route path="/admin/settings/*" element={<SettingsPage />} />
                      <Route path="/admin/profile" element={<ProfilePage />} />
                      <Route path="/admin/password-resets" element={<AdminPasswordResets />} />
                      <Route path="/admin/admission-enquiries" element={<AdminAdmissionEnquiries />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
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
