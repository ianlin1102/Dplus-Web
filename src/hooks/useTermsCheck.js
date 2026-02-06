/**
 * useTermsCheck Hook
 * 用于检查用户条款状态并提供便捷的拦截方法
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkUserTerms } from '../services/termsService'
import { useAuth } from '../contexts/AuthContext'

/**
 * 用户条款检查 Hook
 * @returns {Object} { checkTerms, termsStatus, loading }
 */
export const useTermsCheck = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [termsStatus, setTermsStatus] = useState(null)

  /**
   * 检查用户条款状态
   * @param {Object} options
   * @param {string} options.returnUrl - 同意后返回的 URL
   * @param {boolean} options.redirect - 是否自动跳转到条款页面（默认 true）
   * @returns {Promise<boolean>} - true = 已同意可继续, false = 需要同意
   */
  const checkTerms = useCallback(async (options = {}) => {
    const { returnUrl = window.location.pathname, redirect = true } = options

    // 未登录
    if (!isLoggedIn()) {
      if (redirect) {
        navigate('/login', { state: { returnUrl } })
      }
      return false
    }

    setLoading(true)

    try {
      const result = await checkUserTerms()

      if (!result.success) {
        console.error('检查用户条款失败:', result.message)
        // 失败时默认通过（避免阻塞用户）
        return true
      }

      setTermsStatus(result)

      // 需要同意条款
      if (result.needAgree || result.userAgreed !== 1) {
        if (redirect) {
          navigate('/terms/user', { state: { returnUrl } })
        }
        return false
      }

      // 已同意
      return true
    } catch (error) {
      console.error('检查用户条款异常:', error)
      // 异常时默认通过
      return true
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn, navigate])

  /**
   * 显示条款弹窗提示（不自动跳转）
   * @param {string} returnUrl - 同意后返回的 URL
   * @returns {Promise<{needAgree: boolean, goToTerms: Function}>}
   */
  const showTermsPrompt = useCallback(async (returnUrl) => {
    if (!isLoggedIn()) {
      return {
        needAgree: true,
        notLoggedIn: true,
        goToTerms: () => navigate('/login', { state: { returnUrl } })
      }
    }

    const result = await checkUserTerms()

    if (!result.success) {
      return { needAgree: false }
    }

    if (result.needAgree || result.userAgreed !== 1) {
      return {
        needAgree: true,
        goToTerms: () => navigate('/terms/user', { state: { returnUrl } })
      }
    }

    return { needAgree: false }
  }, [isLoggedIn, navigate])

  return {
    checkTerms,
    showTermsPrompt,
    termsStatus,
    loading
  }
}

export default useTermsCheck
