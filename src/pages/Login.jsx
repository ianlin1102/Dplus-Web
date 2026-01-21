/**
 * 统一登录页面
 * 支持管理员和普通用户登录
 * 登录成功后根据角色跳转到对应的 Dashboard
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import './Login.css'

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '574240389068-uf3u8v3hp2rd1kj642hf81as4uubdmba.apps.googleusercontent.com'
// Use a static HTML file as redirect URI (Google doesn't support hash fragments)
// The HTML file will redirect to our HashRouter route
const GOOGLE_REDIRECT_URI = `${window.location.origin}/oauth-callback.html`
const GOOGLE_SCOPE = 'openid email profile'

// Build Google OAuth URL
const getGoogleAuthUrl = () => {
  const state = crypto.randomUUID()
  // Store state and action for CSRF validation
  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('oauth_action', 'login')

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user, isAdmin } = useAuth()
  const { t, language } = useLanguage()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 如果已登录，自动跳转
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else if (isAdmin()) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, isAdmin, navigate, location])

  const handleGoogleLogin = () => {
    // Log the OAuth URL for debugging
    const authUrl = getGoogleAuthUrl()
    console.log('=== Initiating Google OAuth ===')
    console.log('Redirect URI:', GOOGLE_REDIRECT_URI)
    console.log('OAuth URL:', authUrl)

    // Redirect to Google OAuth
    window.location.href = authUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // 验证
    if (!username || !password) {
      setError(language === 'zh' ? '请输入用户名和密码' : 'Please enter username and password')
      return
    }

    if (username.length < 3 || username.length > 30) {
      setError(language === 'zh' ? '用户名长度需在3-30位之间' : 'Username must be 3-30 characters')
      return
    }

    if (password.length < 3 || password.length > 30) {
      setError(language === 'zh' ? '密码长度需在3-30位之间' : 'Password must be 3-30 characters')
      return
    }

    setLoading(true)

    try {
      const result = await login(username, password)

      if (result.success) {
        // 登录成功，根据角色跳转
        const from = location.state?.from?.pathname
        if (from) {
          navigate(from, { replace: true })
        } else if (result.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else {
        setError(result.message || (language === 'zh' ? '登录失败' : 'Login failed'))
      }
    } catch (err) {
      setError(err.message || (language === 'zh' ? '登录失败' : 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* 背景效果 */}
      <div className="login-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
      </div>

      {/* 返回首页 */}
      <button className="back-home-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
        <span>{language === 'zh' ? '返回首页' : 'Back Home'}</span>
      </button>

      {/* 登录容器 */}
      <div className="login-container">
        {/* Logo 和标题 */}
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-text">STUDIO</span>
          </div>
          <h1 className="login-title">
            {language === 'zh' ? '欢迎回来' : 'Welcome Back'}
          </h1>
          <p className="login-subtitle">
            {language === 'zh' ? '请登录您的账户' : 'Please sign in to your account'}
          </p>
        </div>

        {/* 登录表单 */}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <span className="error-icon">!</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              <span>{language === 'zh' ? '用户名' : 'Username'}</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={language === 'zh' ? '请输入用户名' : 'Enter your username'}
              disabled={loading}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              <span>{language === 'zh' ? '密码' : 'Password'}</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === 'zh' ? '请输入密码' : 'Enter your password'}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                <span>{language === 'zh' ? '登录中...' : 'Signing in...'}</span>
              </>
            ) : (
              <span>{language === 'zh' ? '登录' : 'Sign In'}</span>
            )}
          </button>

          {/* Divider */}
          <div className="login-divider">
            <span>{language === 'zh' ? '或' : 'OR'}</span>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            <span>{language === 'zh' ? '使用 Google 登录' : 'Sign in with Google'}</span>
          </button>
        </form>

        {/* 注册链接 */}
        <div className="login-register-link">
          <p className="register-text">
            {language === 'zh' ? '还没有账户？' : "Don't have an account?"}{' '}
            <Link to="/register" className="register-link">
              {language === 'zh' ? '立即注册' : 'Register'}
            </Link>
          </p>
        </div>

        {/* 底部信息 */}
        <div className="login-footer">
          <p className="footer-text">
            {language === 'zh' ? '舞蹈工作室管理系统' : 'Dance Studio Management System'}
          </p>
          <p className="footer-version">v2.0</p>
        </div>
      </div>
    </div>
  )
}
