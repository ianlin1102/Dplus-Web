/**
 * 统一登录页面
 * 支持管理员和普通用户登录
 * 登录成功后根据角色跳转到对应的 Dashboard
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import './Login.css'

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
        </form>

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
