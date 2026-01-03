import { useState } from 'react'
import { User, Menu, X, Home, Calendar, CreditCard, Info, BookOpen } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import './Navbar.css'

const Navbar = ({ onNavigate, currentPath }) => {
  const { t, language } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/calendar', label: t('nav.calendar'), icon: Calendar },
    { path: '/store', label: t('nav.store'), icon: CreditCard },
    { path: '/appointments', label: language === 'zh' ? '预约' : 'Book', icon: BookOpen },
    { path: '/about', label: language === 'zh' ? '关于' : 'About', icon: Info },
  ]

  const handleNavigate = (path) => {
    onNavigate(path)
    setIsMenuOpen(false)
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo" onClick={() => handleNavigate('/')}>
            <span className="logo-text">
              Dplus
              <span className="logo-suffix">STUDIO</span>
            </span>
          </div>

          {/* Center Nav Links - Desktop */}
          <div className="navbar-links">
            {navItems.slice(0, 3).map((item) => {
              const isActive = currentPath === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                  <span className="nav-link-underline"></span>
                </button>
              )
            })}
          </div>

          {/* Right Side - Desktop: User | Mobile: Hamburger */}
          <div className="navbar-right">
            {/* User Icon - Desktop Only */}
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="user-portal"
              title={t('nav.dashboard')}
            >
              <div className="user-info">
                <p className="welcome-text">{t('dashboard.welcome')}</p>
                <p className="user-name">Login</p>
              </div>
              <div className="user-avatar neon-border-cyan">
                <User size={20} />
              </div>
            </button>

            {/* Hamburger Menu - Mobile Only */}
            <button
              className="hamburger-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">Dplus</span>
          <button className="sidebar-close" onClick={() => setIsMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => handleNavigate('/dashboard')}
            className="sidebar-user"
          >
            <div className="sidebar-user-avatar">
              <User size={20} />
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-label">{t('dashboard.welcome')}</p>
              <p className="sidebar-user-name">Login / Register</p>
            </div>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Navbar
