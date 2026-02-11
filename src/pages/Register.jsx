/**
 * 用户注册页面
 * 支持账号密码注册和 Google 注册
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import { checkUsername as checkUsernameAPI } from '../services/authService'
import './Register.css'

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '574240389068-uf3u8v3hp2rd1kj642hf81as4uubdmba.apps.googleusercontent.com'

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: 'weak', color: '#ef4444' }
  if (score <= 3) return { score, label: 'medium', color: '#f59e0b' }
  return { score, label: 'strong', color: '#22c55e' }
}

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export default function Register() {
  const navigate = useNavigate()
  const { register, loginWithGoogle, user } = useAuth()
  const { language } = useLanguage()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)

  // Username availability check
  const [usernameStatus, setUsernameStatus] = useState('idle') // idle | checking | available | taken | invalid
  const [usernameMessage, setUsernameMessage] = useState('')
  const debouncedUsername = useDebounce(username, 500)

  // Texts
  const texts = {
    title: language === 'zh' ? '创建账户' : 'Create Account',
    subtitle: language === 'zh' ? '注册开始您的体验' : 'Sign up to get started',
    username: language === 'zh' ? '用户名' : 'Username',
    usernamePlaceholder: language === 'zh' ? '3-30位字母、数字或下划线' : '3-30 letters, numbers, or underscore',
    password: language === 'zh' ? '密码' : 'Password',
    passwordPlaceholder: language === 'zh' ? '至少6位字符' : 'At least 6 characters',
    confirmPassword: language === 'zh' ? '确认密码' : 'Confirm Password',
    confirmPasswordPlaceholder: language === 'zh' ? '再次输入密码' : 'Enter password again',
    displayName: language === 'zh' ? '显示名称' : 'Display Name',
    displayNamePlaceholder: language === 'zh' ? '可选' : 'Optional',
    register: language === 'zh' ? '注册' : 'Register',
    registering: language === 'zh' ? '注册中...' : 'Registering...',
    orContinueWith: language === 'zh' ? '或' : 'OR',
    googleRegister: language === 'zh' ? '使用 Google 注册' : 'Sign up with Google',
    haveAccount: language === 'zh' ? '已有账户？' : 'Already have an account?',
    login: language === 'zh' ? '登录' : 'Sign In',
    backHome: language === 'zh' ? '返回首页' : 'Back Home',
    passwordStrength: language === 'zh' ? '密码强度' : 'Password Strength',
    weak: language === 'zh' ? '弱' : 'Weak',
    medium: language === 'zh' ? '中' : 'Medium',
    strong: language === 'zh' ? '强' : 'Strong',
    usernameAvailable: language === 'zh' ? '用户名可用' : 'Username available',
    usernameTaken: language === 'zh' ? '用户名已被使用' : 'Username taken',
    usernameChecking: language === 'zh' ? '检查中...' : 'Checking...',
    passwordMismatch: language === 'zh' ? '两次密码不一致' : 'Passwords do not match',
  }

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(debouncedUsername)) {
      setUsernameStatus('invalid')
      setUsernameMessage(language === 'zh' ? '只能包含字母、数字和下划线' : 'Only letters, numbers, and underscore')
      return
    }

    const checkAvailability = async () => {
      setUsernameStatus('checking')
      const result = await checkUsernameAPI(debouncedUsername)

      if (result.success) {
        if (result.available) {
          setUsernameStatus('available')
          setUsernameMessage(texts.usernameAvailable)
        } else {
          setUsernameStatus('taken')
          setUsernameMessage(result.reason || texts.usernameTaken)
        }
      } else {
        setUsernameStatus('idle')
        setUsernameMessage('')
      }
    }

    checkAvailability()
  }, [debouncedUsername, language, texts.usernameAvailable, texts.usernameTaken])

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!username || username.length < 3) {
      setError(language === 'zh' ? '请输入至少3位用户名' : 'Username must be at least 3 characters')
      return
    }

    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setError(usernameMessage)
      return
    }

    if (!password || password.length < 6) {
      setError(language === 'zh' ? '密码至少6位' : 'Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError(texts.passwordMismatch)
      return
    }

    setLoading(true)

    try {
      const result = await register(username, password, name || username)

      if (result.success) {
        navigate('/dashboard', { replace: true })
      } else {
        setError(result.message || (language === 'zh' ? '注册失败' : 'Registration failed'))
      }
    } catch (err) {
      setError(err.message || (language === 'zh' ? '注册失败' : 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth 回调处理
  const handleGoogleCallback = useCallback(async (response) => {
    if (!response.credential) {
      setError(language === 'zh' ? 'Google 注册失败' : 'Google sign-up failed')
      return
    }

    setGoogleLoading(true)
    setError(null)

    try {
      const result = await loginWithGoogle(response.credential)

      if (result.success) {
        if (result.isNewUser) {
          navigate('/auth/google/callback', {
            state: { isNewUser: true, user: result.user }
          })
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else {
        setError(result.message || (language === 'zh' ? 'Google 注册失败' : 'Google sign-up failed'))
      }
    } catch (err) {
      console.error('Google register error:', err)
      setError(err.message || (language === 'zh' ? 'Google 注册失败' : 'Google sign-up failed'))
    } finally {
      setGoogleLoading(false)
    }
  }, [loginWithGoogle, navigate, language])

  // 使用 OAuth 弹窗（implicit flow，与 Login 页一致）
  const handleGoogleRegister = () => {
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + '/oauth-callback.html')}&` +
      `response_type=token id_token&` +
      `scope=openid email profile&` +
      `prompt=select_account&` +
      `nonce=${crypto.randomUUID()}`,
      'google-register',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    let channel = null
    try {
      channel = new BroadcastChannel('oauth-channel')
      channel.onmessage = (event) => {
        if (event.data?.type === 'google-auth') {
          channel.close()
          if (event.data.id_token) {
            handleGoogleCallback({ credential: event.data.id_token })
          } else if (event.data.error) {
            setError(event.data.error)
          }
        }
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported, using postMessage fallback')
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type === 'google-auth') {
          window.removeEventListener('message', handleMessage)
          if (event.data.id_token) {
            handleGoogleCallback({ credential: event.data.id_token })
          } else if (event.data.error) {
            setError(event.data.error)
          }
          try { popup?.close() } catch (e) { /* ignore COOP errors */ }
        }
      }
      window.addEventListener('message', handleMessage)
    }
  }

  // Username status icon
  const renderUsernameStatus = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 size={16} className="status-icon checking" />
      case 'available':
        return <CheckCircle size={16} className="status-icon available" />
      case 'taken':
      case 'invalid':
        return <XCircle size={16} className="status-icon taken" />
      default:
        return null
    }
  }

  return (
    <div className="register-page">
      {/* Background */}
      <div className="register-bg">
        <div className="bg-gradient"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Back button */}
      <button className="back-home-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
        <span>{texts.backHome}</span>
      </button>

      {/* Register container */}
      <div className="register-container">
        {/* Header */}
        <div className="register-header">
          <div className="register-logo">
            <span className="logo-text">STUDIO</span>
          </div>
          <h1 className="register-title">{texts.title}</h1>
          <p className="register-subtitle">{texts.subtitle}</p>
        </div>

        {/* Register form */}
        <form className="register-form" onSubmit={handleSubmit}>
          {error && (
            <div className="register-error">
              <span className="error-icon">!</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              <span>{texts.username}</span>
            </label>
            <div className="input-with-status">
              <input
                type="text"
                className={`form-input ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'error' : ''} ${usernameStatus === 'available' ? 'success' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder={texts.usernamePlaceholder}
                disabled={loading}
                autoComplete="username"
                maxLength={30}
              />
              <div className="input-status">
                {renderUsernameStatus()}
              </div>
            </div>
            {usernameMessage && (
              <p className={`input-hint ${usernameStatus === 'available' ? 'success' : 'error'}`}>
                {usernameMessage}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              <span>{texts.password}</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={texts.passwordPlaceholder}
                disabled={loading}
                autoComplete="new-password"
                maxLength={30}
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
            {password && (
              <div className="password-strength">
                <span className="strength-label">{texts.passwordStrength}:</span>
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  {texts[passwordStrength.label]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              <span>{texts.confirmPassword}</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input ${confirmPassword && password !== confirmPassword ? 'error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={texts.confirmPasswordPlaceholder}
                disabled={loading}
                autoComplete="new-password"
                maxLength={30}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="input-hint error">{texts.passwordMismatch}</p>
            )}
          </div>

          {/* Display Name (optional) */}
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              <span>{texts.displayName}</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={texts.displayNamePlaceholder}
              disabled={loading}
              maxLength={20}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="register-btn"
            disabled={loading || usernameStatus === 'taken' || usernameStatus === 'invalid'}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="btn-spinner" />
                <span>{texts.registering}</span>
              </>
            ) : (
              <span>{texts.register}</span>
            )}
          </button>

          {/* Divider */}
          <div className="register-divider">
            <span>{texts.orContinueWith}</span>
          </div>

          {/* Google Register */}
          <button
            type="button"
            className="google-register-btn"
            onClick={handleGoogleRegister}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <>
                <Loader2 size={18} className="btn-spinner" />
                <span>{language === 'zh' ? '注册中...' : 'Signing up...'}</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>{texts.googleRegister}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p className="footer-text">
            {texts.haveAccount}{' '}
            <Link to="/login" className="footer-link">{texts.login}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
