import { useState, useEffect, createContext, useContext } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Sun, Moon, Globe } from 'lucide-react'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import Navbar from './components/Navbar'

// User Pages
import Home from './pages/user/Home'
import CardStore from './pages/user/CardStore'
import Calendar from './pages/user/Calendar'
import Dashboard from './pages/user/Dashboard'
import About from './pages/user/About'
import Appointments from './pages/user/Appointments'

// Admin Pages
import AdminLogin from './pages/admin/index/AdminLogin'
import AdminDashboard from './pages/admin/index/AdminDashboard'
import CardManagement from './pages/admin/card/CardManagement'

// Test Pages
import RankingTest from './pages/test/RankingTest'
import CloudTest from './pages/test/CloudTest'
import CloudFunctionTest from './pages/test/CloudFunctionTest'
import CardTest from './pages/test/CardTest'

import './styles/App.css'

// Theme Context
export const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

// Theme Toggle Button Component
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  )
}

// Language Toggle Button Component
const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="language-toggle"
      title={language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe size={20} />
      <span className="lang-label">{language === 'zh' ? 'EN' : '中'}</span>
    </button>
  )
}

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
      {/* Public Pages */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/store" element={<PublicLayout><CardStore /></PublicLayout>} />
      <Route path="/calendar" element={<PublicLayout><Calendar /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/appointments" element={<PublicLayout><Appointments /></PublicLayout>} />

      {/* Test Pages */}
      <Route path="/ranking-test" element={<RankingTest />} />
      <Route path="/cloud-test" element={<CloudTest />} />
      <Route path="/cloud-function-test" element={<CloudFunctionTest />} />
      <Route path="/card-test" element={<CardTest />} />

      {/* Admin Pages */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/cards" element={<CardManagement />} />

      {/* Dashboard (Sidebar Layout) */}
      <Route path="/dashboard/*" element={<Dashboard />} />
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
          <div className={`app ${isDark ? 'dark' : 'light'}`}>
            <div className="global-controls">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <AppContent />
          </div>
        </Router>
      </ThemeContext.Provider>
    </LanguageProvider>
  )
}

export default App
