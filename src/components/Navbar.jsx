import { useState, useRef, useEffect } from 'react'
import { User, Menu, X, Home, Calendar, CreditCard, Info, BookOpen, LogOut, Shield, ChevronDown, LayoutDashboard } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

const Navbar = ({ onNavigate, currentPath }) => {
  const { t, language } = useLanguage()
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    setIsUserDropdownOpen(false)
    onNavigate('/')
  }

  const handleUserClick = () => {
    if (isLoggedIn()) {
      setIsUserDropdownOpen(!isUserDropdownOpen)
    } else {
      handleNavigate('/login')
    }
  }

  const handleDashboardClick = () => {
    setIsUserDropdownOpen(false)
    if (isAdmin()) {
      handleNavigate('/admin/dashboard')
    } else {
      handleNavigate('/dashboard')
    }
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
            {/* User Portal - Desktop Only */}
            <div className="user-portal-wrapper" ref={dropdownRef}>
              <button
                onClick={handleUserClick}
                className="user-portal"
                title={isLoggedIn() ? (isAdmin() ? '管理后台' : t('nav.dashboard')) : '登录'}
              >
                <div className="user-info">
                  <p className="welcome-text">
                    {isLoggedIn() ? t('dashboard.welcome') : (language === 'zh' ? '欢迎' : 'Welcome')}
                  </p>
                  <p className="user-name">
                    {isLoggedIn() ? user?.name : (language === 'zh' ? '登录' : 'Login')}
                  </p>
                </div>
                <div className={`user-avatar ${isAdmin() ? 'admin-avatar' : 'neon-border-cyan'}`}>
                  {isAdmin() ? <Shield size={20} /> : <User size={20} />}
                </div>
                {isLoggedIn() && <ChevronDown size={16} className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`} />}
              </button>

              {/* User Dropdown Menu */}
              {isLoggedIn() && isUserDropdownOpen && (
                <div className="user-dropdown">
                  <button onClick={handleDashboardClick} className="dropdown-item">
                    <LayoutDashboard size={18} />
                    <span>{isAdmin() ? (language === 'zh' ? '管理后台' : 'Dashboard') : t('nav.dashboard')}</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <LogOut size={18} />
                    <span>{language === 'zh' ? '退出登录' : 'Logout'}</span>
                  </button>
                </div>
              )}
            </div>

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
          {isLoggedIn() ? (
            <>
              <button
                onClick={handleUserClick}
                className="sidebar-user"
              >
                <div className={`sidebar-user-avatar ${isAdmin() ? 'admin' : ''}`}>
                  {isAdmin() ? <Shield size={20} /> : <User size={20} />}
                </div>
                <div className="sidebar-user-info">
                  <p className="sidebar-user-label">
                    {isAdmin() ? (language === 'zh' ? '管理员' : 'Admin') : t('dashboard.welcome')}
                  </p>
                  <p className="sidebar-user-name">{user?.name}</p>
                </div>
              </button>
              <button onClick={handleLogout} className="sidebar-logout">
                <LogOut size={18} />
                <span>{language === 'zh' ? '退出登录' : 'Logout'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNavigate('/login')}
              className="sidebar-user"
            >
              <div className="sidebar-user-avatar">
                <User size={20} />
              </div>
              <div className="sidebar-user-info">
                <p className="sidebar-user-label">{language === 'zh' ? '欢迎' : 'Welcome'}</p>
                <p className="sidebar-user-name">{language === 'zh' ? '登录 / 注册' : 'Login / Register'}</p>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

export default Navbar
