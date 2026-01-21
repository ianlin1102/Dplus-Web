/**
 * Google OAuth Callback Page
 * Handles OAuth redirect for login/register and account linking
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import './GoogleCallback.css'

// Google OAuth redirect URI (must match the one used in Login/Register)
const GOOGLE_REDIRECT_URI = `${window.location.origin}/oauth-callback.html`

export default function GoogleCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { language } = useLanguage()
  const { loginWithGoogle, linkGoogle, user } = useAuth()

  const [status, setStatus] = useState('loading') // loading | success | error
  const [oauthData, setOauthData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [actionType, setActionType] = useState('login') // login | link

  useEffect(() => {
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    // Get OAuth response parameters from URL
    const code = searchParams.get('code')
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
    console.log('State match:', state === savedState)

    // Check for OAuth error
    if (error) {
      const errorDesc = searchParams.get('error_description') || error
      console.error('OAuth Error:', error, errorDesc)
      setErrorMessage(errorDesc)
      setStatus('error')
      return
    }

    // Check for authorization code
    if (!code) {
      console.warn('No authorization code received')
      setErrorMessage(language === 'zh' ? '未收到授权码' : 'No authorization code received')
      setStatus('error')
      return
    }

    // Validate CSRF state
    if (state !== savedState) {
      console.error('CSRF state mismatch:', { received: state, expected: savedState })
      setErrorMessage(language === 'zh' ? '安全验证失败，请重试' : 'Security validation failed, please try again')
      setStatus('error')
      return
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
        // Login or register with Google
        const result = await loginWithGoogle(code, GOOGLE_REDIRECT_URI)

        if (result.success) {
          setOauthData({ user: result.user })
          setIsNewUser(result.isNewUser || false)
          setStatus('success')
        } else {
          setErrorMessage(result.message || (language === 'zh' ? '登录失败' : 'Login failed'))
          setStatus('error')
        }
      }
    } catch (err) {
      console.error('OAuth processing error:', err)
      setErrorMessage(err.message || (language === 'zh' ? '处理失败' : 'Processing failed'))
      setStatus('error')
    }
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
