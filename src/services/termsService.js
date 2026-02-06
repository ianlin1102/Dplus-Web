/**
 * Terms Service - 条款相关 API
 * 处理用户条款检查、同意、获取内容等
 */

const CLOUD_FUNCTION_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

/**
 * 获取当前用户 token (从 localStorage)
 * 兼容多种存储格式：auth_info (新格式) 和 auth_user (旧格式)
 */
const getUserToken = () => {
  // 优先检查 auth_info（AuthContext 格式）
  const authInfo = localStorage.getItem('auth_info')
  if (authInfo) {
    try {
      const parsed = JSON.parse(authInfo)
      // auth_info 格式: { user: { id, name, role, type }, expireTime }
      if (parsed.user && parsed.user.id) {
        return parsed.user.id
      }
    } catch (e) {
      console.error('解析 auth_info 失败:', e)
    }
  }

  // 兼容旧的 auth_user 格式
  const authData = localStorage.getItem('auth_user')
  if (authData) {
    try {
      const user = JSON.parse(authData)
      return user._id || user.USER_MINI_OPENID || ''
    } catch (e) {
      console.error('解析 auth_user 失败:', e)
    }
  }

  return ''
}

/**
 * 调用云函数 API
 */
const callAPI = async (route, params = {}, token = '') => {
  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route,
        PID: 'A00',
        token,
        params
      })
    })

    const result = await response.json()

    if (result.code === 200 || result.code === 0) {
      return { success: true, data: result.data }
    } else {
      return { success: false, message: result.msg || '请求失败' }
    }
  } catch (error) {
    console.error(`API ${route} error:`, error)
    return { success: false, message: error.message || '网络错误' }
  }
}

/**
 * 收集设备信息（用于条款同意记录）
 */
export const getDeviceInfo = () => {
  return {
    platform: 'web',
    system: navigator.platform || '',
    model: '',
    brand: '',
    screenWidth: window.screen.width || 0,
    screenHeight: window.screen.height || 0,
    language: navigator.language || '',
    userAgent: navigator.userAgent || '',
    networkType: navigator.connection?.effectiveType || 'unknown'
  }
}

/**
 * 检查用户条款状态
 * @returns {Promise<{success: boolean, needAgree?: boolean, currentVersion?: number, userVersion?: number, userAgreed?: number}>}
 */
export const checkUserTerms = async () => {
  const token = getUserToken()
  if (!token) {
    return { success: false, message: '请先登录', notLoggedIn: true }
  }

  const result = await callAPI('terms/check_user_terms', {}, token)
  if (result.success) {
    return {
      success: true,
      needAgree: result.data.needAgree,
      currentVersion: result.data.currentVersion,
      userVersion: result.data.userVersion,
      userAgreed: result.data.userAgreed
    }
  }
  return result
}

/**
 * 同意用户条款
 * @param {number} version - 条款版本号
 * @param {string} printedName - 法律姓名
 * @param {boolean} checkbox - 是否打勾
 * @returns {Promise<{success: boolean}>}
 */
export const agreeUserTerms = async (version, printedName, checkbox = true) => {
  const token = getUserToken()
  if (!token) {
    return { success: false, message: '请先登录' }
  }

  const deviceInfo = getDeviceInfo()

  const result = await callAPI('terms/agree_user_terms', {
    version,
    printedName,
    checkbox,
    deviceInfo
  }, token)

  return result
}

/**
 * 获取条款内容
 * @param {string} type - 条款类型: 'user_terms' | 'card_terms' | 'booking_terms'
 * @returns {Promise<{success: boolean, sections?: Array, version?: number}>}
 */
export const getTermsContent = async (type = 'user_terms') => {
  const result = await callAPI('terms/get', { type })
  if (result.success) {
    return {
      success: true,
      sections: result.data.sections || [],
      version: result.data.version || 0
    }
  }
  return result
}

export default {
  checkUserTerms,
  agreeUserTerms,
  getTermsContent,
  getDeviceInfo
}
