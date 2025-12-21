import { User } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import './Navbar.css'

const Navbar = ({ onNavigate, currentPath }) => {
  const { t } = useLanguage()

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/calendar', label: t('nav.calendar') },
    { path: '/store', label: t('nav.store') },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => onNavigate('/')}>
          <span className="logo-text">
            Dplus
            <span className="logo-suffix">STUDIO</span>
          </span>
        </div>

        {/* Center Nav Links */}
        <div className="navbar-links">
          {navItems.map((item) => {
            const isActive = currentPath === item.path
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
                <span className="nav-link-underline"></span>
              </button>
            )
          })}
        </div>

        {/* User Icon - Portal to Dashboard */}
        <button
          onClick={() => onNavigate('/dashboard')}
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
      </div>
    </nav>
  )
}

export default Navbar
