/**
 * Auth Service - 认证相关 API
 * 处理注册、登录、Google OAuth、账户关联等
 */

const CLOUD_FUNCTION_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

/**
 * 调用云函数 API
 */
const callAPI = async (route, params = {}, token = '') => {
  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
 * 获取当前用户 token (从 localStorage)
 */
const getUserToken = () => {
  try {
    const authInfo = localStorage.getItem('auth_info')
    if (authInfo) {
      const parsed = JSON.parse(authInfo)
      return parsed.user?.id || ''
    }
  } catch (e) {
    console.error('Failed to get user token:', e)
  }
  return ''
}

// ==================== 公开 API ====================

/**
 * 检查用户名是否可用
 * @param {string} username
 * @returns {Promise<{success: boolean, available?: boolean, reason?: string}>}
 */
export const checkUsername = async (username) => {
  const result = await callAPI('passport/check_username', { username })
  if (result.success) {
    return {
      success: true,
      available: result.data.available,
      reason: result.data.reason
    }
  }
  return result
}

/**
 * 用户注册
 * @param {Object} params - { username, password, name? }
 * @returns {Promise<{success: boolean, userId?: string, user?: object}>}
 */
export const register = async ({ username, password, name }) => {
  const result = await callAPI('passport/register', { username, password, name })
  if (result.success) {
    return {
      success: true,
      userId: result.data.userId,
      user: result.data.user
    }
  }
  return result
}

/**
 * 用户登录（账号密码）
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, userId?: string, user?: object}>}
 */
export const loginWithCredentials = async (username, password) => {
  const result = await callAPI('passport/login', { username, password })
  if (result.success) {
    return {
      success: true,
      userId: result.data.userId,
      user: result.data.user
    }
  }
  return result
}

/**
 * Google OAuth 认证（登录或注册）
 * @param {string} code - Google 授权码
 * @param {string} redirectUri
 * @returns {Promise<{success: boolean, userId?: string, user?: object, isNewUser?: boolean}>}
 */
export const googleAuth = async (code, redirectUri) => {
  const result = await callAPI('passport/google_auth', { code, redirectUri })
  if (result.success) {
    return {
      success: true,
      userId: result.data.userId,
      user: result.data.user,
      isNewUser: result.data.isNewUser
    }
  }
  return result
}

// ==================== 需要认证的 API ====================

/**
 * 关联 Google 账户
 * @param {string} code - Google 授权码
 * @param {string} redirectUri
 * @returns {Promise<{success: boolean, googleEmail?: string, authMethods?: string[]}>}
 */
export const linkGoogle = async (code, redirectUri) => {
  const token = getUserToken()
  const result = await callAPI('my/link_google', { code, redirectUri }, token)
  if (result.success) {
    return {
      success: true,
      googleEmail: result.data.googleEmail,
      authMethods: result.data.authMethods
    }
  }
  return result
}

/**
 * 取消关联 Google 账户
 * @returns {Promise<{success: boolean, authMethods?: string[]}>}
 */
export const unlinkGoogle = async () => {
  const token = getUserToken()
  const result = await callAPI('my/unlink_google', {}, token)
  if (result.success) {
    return {
      success: true,
      authMethods: result.data.authMethods
    }
  }
  return result
}

/**
 * 获取用户认证方式
 * @returns {Promise<{success: boolean, methods?: string[], googleEmail?: string, username?: string}>}
 */
export const getAuthMethods = async () => {
  const token = getUserToken()
  const result = await callAPI('my/auth_methods', {}, token)
  if (result.success) {
    return {
      success: true,
      methods: result.data.methods,
      googleEmail: result.data.googleEmail,
      username: result.data.username
    }
  }
  return result
}
