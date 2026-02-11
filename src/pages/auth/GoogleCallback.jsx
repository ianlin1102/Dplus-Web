/**
 * Google OAuth Callback Page
 * Handles OAuth redirect for login/register and account linking
 * New users will be prompted to fill in basic profile info
 * Updated: 2026-01-21 - 支持 ID Token 流程和新用户资料填写
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, User, Phone } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { editUserBase } from '../../services/api'
import './GoogleCallback.css'

// Google OAuth redirect URI (must match the one used in Login/Register)
const GOOGLE_REDIRECT_URI = `${window.location.origin}/oauth-callback.html`

export default function GoogleCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { language } = useLanguage()
  const { loginWithGoogle, linkGoogle, user } = useAuth()

  const [status, setStatus] = useState('loading') // loading | success | profile | error
  const [oauthData, setOauthData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [actionType, setActionType] = useState('login') // login | link

  // Profile form for new users
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [countryCode, setCountryCode] = useState('+86')

  // Prevent double execution in React StrictMode
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    // Check if this is a new user coming from Login.jsx with state
    if (location.state?.isNewUser && location.state?.user) {
      console.log('New user from Login, showing profile form')
      setOauthData({ user: location.state.user })
      setIsNewUser(true)
      if (location.state.user?.name) {
        setProfileForm(prev => ({ ...prev, name: location.state.user.name }))
      }
      setStatus('profile')
      return
    }

    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    // Get OAuth response parameters from URL
    const code = searchParams.get('code')
    const idToken = searchParams.get('id_token') // For implicit flow
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    // Get stored state and action for CSRF validation
    const savedState = sessionStorage.getItem('oauth_state')
    const action = sessionStorage.getItem('oauth_action') || 'login'
    setActionType(action)

    // Clean up sessionStorage
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem('oauth_action')

    // Log for debugging
    console.log('=== Google OAuth Callback ===')
    console.log('Full URL:', window.location.href)
    console.log('Action:', action)
    console.log('Has code:', !!code)
    console.log('Has id_token:', !!idToken)

    // Check for OAuth error
    if (error) {
      const errorDesc = searchParams.get('error_description') || error
      console.error('OAuth Error:', error, errorDesc)
      setErrorMessage(errorDesc)
      setStatus('error')
      return
    }

    // Handle ID Token flow (implicit flow from popup fallback)
    if (idToken) {
      console.log('Processing ID Token flow')
      try {
        const result = await loginWithGoogle(idToken)
        if (result.success) {
          setOauthData({ user: result.user })
          setIsNewUser(result.isNewUser || false)
          if (result.user?.name) {
            setProfileForm(prev => ({ ...prev, name: result.user.name }))
          }
          setStatus(result.isNewUser ? 'profile' : 'success')
        } else {
          setErrorMessage(result.message || (language === 'zh' ? '登录失败' : 'Login failed'))
          setStatus('error')
        }
      } catch (err) {
        console.error('ID Token login error:', err)
        setErrorMessage(err.message || (language === 'zh' ? '处理失败' : 'Processing failed'))
        setStatus('error')
      }
      return
    }

    // Check for authorization code (for account linking which still uses code flow)
    if (!code) {
      console.warn('No authorization code or id_token received')
      setErrorMessage(language === 'zh' ? '未收到授权信息' : 'No authorization received')
      setStatus('error')
      return
    }

    // Validate CSRF state (warn but don't block if sessionStorage was cleared)
    if (savedState && state !== savedState) {
      console.error('CSRF state mismatch:', { received: state, expected: savedState })
      setErrorMessage(language === 'zh' ? '安全验证失败，请重试' : 'Security validation failed, please try again')
      setStatus('error')
      return
    }
    if (!savedState) {
      console.warn('CSRF state not found in sessionStorage, proceeding anyway')
    }

    // Process the OAuth code based on action type
    try {
      if (action === 'link') {
        // Link Google to existing account
        if (!user) {
          setErrorMessage(language === 'zh' ? '请先登录' : 'Please login first')
          setStatus('error')
          return
        }

        const result = await linkGoogle(code, GOOGLE_REDIRECT_URI)

        if (result.success) {
          setOauthData({ googleEmail: result.googleEmail })
          setStatus('success')
        } else {
          setErrorMessage(result.message || (language === 'zh' ? '关联失败' : 'Failed to link account'))
          setStatus('error')
        }
      } else {
        // Authorization code flow is no longer used for login/register
        // (Login and Register pages now use implicit flow with id_token)
        // If we get here with a code, redirect user to login page to retry
        console.warn('Received authorization code instead of id_token, redirecting to login')
        setErrorMessage(language === 'zh' ? '请重新登录' : 'Please try logging in again')
        setStatus('error')
      }
    } catch (err) {
      console.error('OAuth processing error:', err)
      setErrorMessage(err.message || (language === 'zh' ? '处理失败' : 'Processing failed'))
      setStatus('error')
    }
  }

  // Handle profile form submission for new users
  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    // Validate
    if (!profileForm.name.trim()) {
      setErrorMessage(language === 'zh' ? '请填写姓名' : 'Please enter your name')
      return
    }
    if (!profileForm.phone.trim()) {
      setErrorMessage(language === 'zh' ? '请填写手机号' : 'Please enter your phone number')
      return
    }

    setProfileSaving(true)
    setErrorMessage('')

    try {
      const fullPhone = countryCode + profileForm.phone.trim()
      const result = await editUserBase({
        name: profileForm.name.trim(),
        mobile: fullPhone,
        city: '',
        work: '',
        trade: ''
      })

      if (result.code === 200) {
        setStatus('success')
      } else {
        setErrorMessage(result.msg || (language === 'zh' ? '保存失败' : 'Failed to save'))
      }
    } catch (err) {
      console.error('Profile save error:', err)
      setErrorMessage(language === 'zh' ? '保存失败，请重试' : 'Failed to save, please try again')
    } finally {
      setProfileSaving(false)
    }
  }

  // Skip profile for now
  const handleSkipProfile = () => {
    setStatus('success')
  }

  const handleContinue = () => {
    if (actionType === 'link') {
      // Go back to settings page after linking
      navigate('/dashboard', { state: { tab: 'settings' } })
    } else {
      navigate('/dashboard')
    }
  }

  const handleRetry = () => {
    if (actionType === 'link') {
      navigate('/dashboard', { state: { tab: 'settings' } })
    } else {
      navigate('/login')
    }
  }

  const handleBackHome = () => {
    navigate('/')
  }

  // Get success message based on action type
  const getSuccessTitle = () => {
    if (actionType === 'link') {
      return language === 'zh' ? '关联成功!' : 'Account Linked!'
    }
    if (isNewUser) {
      return language === 'zh' ? '注册成功!' : 'Registration Successful!'
    }
    return language === 'zh' ? '登录成功!' : 'Login Successful!'
  }

  const getSuccessMessage = () => {
    if (actionType === 'link') {
      return language === 'zh'
        ? `已成功关联 Google 账户: ${oauthData?.googleEmail || ''}`
        : `Successfully linked Google account: ${oauthData?.googleEmail || ''}`
    }
    if (isNewUser) {
      return language === 'zh' ? '欢迎加入！' : 'Welcome aboard!'
    }
    return language === 'zh' ? 'Google 账户验证通过' : 'Google account verified'
  }

  const getErrorTitle = () => {
    if (actionType === 'link') {
      return language === 'zh' ? '关联失败' : 'Linking Failed'
    }
    return language === 'zh' ? '登录失败' : 'Login Failed'
  }

  return (
    <div className="google-callback-page">
      <div className="callback-bg">
        <div className="bg-gradient"></div>
      </div>

      <div className="callback-container">
        {status === 'loading' && (
          <div className="callback-content loading">
            <Loader className="spinner" size={48} />
            <h2>{language === 'zh' ? '处理中...' : 'Processing...'}</h2>
            <p>
              {actionType === 'link'
                ? (language === 'zh' ? '正在关联您的 Google 账户' : 'Linking your Google account')
                : (language === 'zh' ? '正在验证您的 Google 账户' : 'Verifying your Google account')}
            </p>
          </div>
        )}

        {status === 'profile' && (
          <div className="callback-content profile">
            <div className="status-icon success">
              <CheckCircle size={64} />
            </div>
            <h2>{language === 'zh' ? '欢迎加入!' : 'Welcome!'}</h2>
            <p>{language === 'zh' ? '请完善您的个人信息' : 'Please complete your profile'}</p>

            <form className="profile-form" onSubmit={handleProfileSubmit}>
              {errorMessage && (
                <div className="form-error">{errorMessage}</div>
              )}

              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  <span>{language === 'zh' ? '姓名' : 'Name'} *</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
                  disabled={profileSaving}
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} />
                  <span>{language === 'zh' ? '手机号' : 'Phone'} *</span>
                </label>
                <div className="phone-input-group">
                  <select
                    className="country-code-select"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={profileSaving}
                  >
                    <option value="+86">+86 中国</option>
                    <option value="+1">+1 美国</option>
                  </select>
                  <input
                    type="tel"
                    className="form-input phone-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                    placeholder={countryCode === '+86' ? '11位手机号' : '10 digits'}
                    disabled={profileSaving}
                    maxLength={countryCode === '+86' ? 11 : 10}
                  />
                </div>
              </div>

              <div className="profile-actions">
                <button type="submit" className="btn-primary" disabled={profileSaving}>
                  {profileSaving ? (
                    <>
                      <Loader size={16} className="spinner" />
                      <span>{language === 'zh' ? '保存中...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{language === 'zh' ? '完成注册' : 'Complete Registration'}</span>
                  )}
                </button>
                <button type="button" className="btn-secondary" onClick={handleSkipProfile} disabled={profileSaving}>
                  {language === 'zh' ? '稍后完善' : 'Skip for now'}
                </button>
              </div>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="callback-content success">
            <div className="status-icon success">
              <CheckCircle size={64} />
            </div>
            <h2>{getSuccessTitle()}</h2>
            <p>{getSuccessMessage()}</p>

            <div className="callback-actions">
              <button className="btn-primary" onClick={handleContinue}>
                {language === 'zh' ? '继续' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="callback-content error">
            <div className="status-icon error">
              <XCircle size={64} />
            </div>
            <h2>{getErrorTitle()}</h2>
            <p className="error-message">{errorMessage}</p>

            <div className="callback-actions">
              <button className="btn-primary" onClick={handleRetry}>
                {language === 'zh' ? '重试' : 'Try Again'}
              </button>
              <button className="btn-secondary" onClick={handleBackHome}>
                {language === 'zh' ? '返回首页' : 'Back to Home'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
