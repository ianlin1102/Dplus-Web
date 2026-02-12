import { useState, useEffect, createContext, useContext } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth, RequireAdmin, RequireUser, RoleBasedRedirect } from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// User Pages
import Home from './pages/user/Home'
import CardStore from './pages/user/CardStore'
import Calendar from './pages/user/Calendar'
import Dashboard from './pages/user/Dashboard'
import About from './pages/user/About'
// import Appointments from './pages/user/Appointments'
import BookingConfirm from './pages/user/BookingConfirm'
import UserTerms from './pages/terms/UserTerms'
import TermsPrint from './pages/terms/TermsPrint'
import SchedulePrint from './pages/schedule/SchedulePrint'

// Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'
import GoogleCallback from './pages/auth/GoogleCallback'

// Admin Pages
import AdminDashboard from './pages/admin/index/AdminDashboard'
import CardManagement from './pages/admin/card/CardManagement'
import UserManagement from './pages/admin/user/UserManagement'
import BookingManagement from './pages/admin/booking/BookingManagement'
import MeetManagement from './pages/admin/meet/MeetManagement'
import MeetEditor from './pages/admin/meet/MeetEditor'
import UserCardManage from './pages/admin/usercard/UserCardManage'

// Test Pages
import RankingTest from './pages/test/RankingTest'
import CloudTest from './pages/test/CloudTest'
import CloudFunctionTest from './pages/test/CloudFunctionTest'
import CardTest from './pages/test/CardTest'
import CloudStorageTest from './pages/test/CloudStorageTest'
import PurchaseApiTest from './pages/test/PurchaseApiTest.jsx'
import IntroDemo from './pages/IntroDemo'

import './styles/App.css'

// Theme Context
export const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

// Public Layout with Fixed Navbar
const PublicLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="public-layout">
      <Navbar
        onNavigate={(path) => navigate(path)}
        currentPath={location.pathname}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

function AppContent() {
  return (
    <Routes>
      {/* Public Pages - No auth required */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/store" element={<PublicLayout><CardStore /></PublicLayout>} />
      <Route path="/calendar" element={<PublicLayout><Calendar /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      {/* <Route path="/appointments" element={<PublicLayout><Appointments /></PublicLayout>} /> */}

      {/* Booking Confirmation - Requires auth */}
      <Route path="/booking/confirm" element={
        <RequireAuth>
          <PublicLayout>
            <BookingConfirm />
          </PublicLayout>
        </RequireAuth>
      } />

      {/* Terms Print - No layout, auth via token query param */}
      <Route path="/terms/print/:id" element={<TermsPrint />} />

      {/* Schedule - No layout, no auth, public shareable page */}
      <Route path="/schedule/:yearMonth" element={<SchedulePrint />} />
      <Route path="/schedule" element={<SchedulePrint />} />

      {/* User Terms - Requires auth */}
      <Route path="/terms/user" element={
        <RequireAuth>
          <PublicLayout>
            <UserTerms />
          </PublicLayout>
        </RequireAuth>
      } />

      {/* Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Role-based redirect after login */}
      <Route path="/redirect" element={<RoleBasedRedirect />} />

      {/* Test Pages */}
      <Route path="/ranking-test" element={<RankingTest />} />
      <Route path="/cloud-test" element={<CloudTest />} />
      <Route path="/cloud-function-test" element={<CloudFunctionTest />} />
      <Route path="/card-test" element={<CardTest />} />
      <Route path="/cloud-storage-test" element={<CloudStorageTest />} />
      <Route path="/purchase-api-test" element={<PurchaseApiTest />} />
      <Route path="/intro" element={<IntroDemo />} />

      {/* Admin Pages - Require admin auth */}
      <Route path="/admin/dashboard" element={
        <RequireAdmin>
          <AdminDashboard />
        </RequireAdmin>
      } />
      <Route path="/admin/cards" element={
        <RequireAdmin>
          <CardManagement />
        </RequireAdmin>
      } />
      <Route path="/admin/users" element={
        <RequireAdmin>
          <UserManagement />
        </RequireAdmin>
      } />
      <Route path="/admin/bookings" element={
        <RequireAdmin>
          <BookingManagement />
        </RequireAdmin>
      } />
      <Route path="/admin/meets" element={
        <RequireAdmin>
          <MeetManagement />
        </RequireAdmin>
      } />
      <Route path="/admin/meet/edit" element={
        <RequireAdmin>
          <MeetEditor />
        </RequireAdmin>
      } />
      <Route path="/admin/meet/edit/:meetId" element={
        <RequireAdmin>
          <MeetEditor />
        </RequireAdmin>
      } />
      <Route path="/admin/user-cards" element={
        <RequireAdmin>
          <UserCardManage />
        </RequireAdmin>
      } />
      {/* Placeholder routes for admin features */}
      <Route path="/admin/*" element={
        <RequireAdmin>
          <AdminDashboard />
        </RequireAdmin>
      } />

      {/* User Dashboard - Require user auth */}
      <Route path="/dashboard/*" element={
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      } />

      {/* Legacy admin login redirect */}
      <Route path="/admin/login" element={<Login />} />
    </Routes>
  )
}

function App() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light')
    } else {
      document.body.classList.add('light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <LanguageProvider>
      <ThemeContext.Provider value={{ isDark, toggleTheme }}>
        <Router>
          <AuthProvider>
            <div className={`app ${isDark ? 'dark' : 'light'}`}>
              <AppContent />
            </div>
          </AuthProvider>
        </Router>
      </ThemeContext.Provider>
    </LanguageProvider>
  )
}

export default App
