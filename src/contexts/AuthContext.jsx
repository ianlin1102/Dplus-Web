/**
 * 认证上下文
 * 统一管理用户登录状态、角色判断、权限检查
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

// 缓存 key
const AUTH_CACHE_KEY = 'auth_info'
const AUTH_EXPIRE_TIME = 7200 * 1000 // 2小时

/**
 * 认证 Provider
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // 初始化时检查登录状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  /**
   * 检查认证状态
   */
  const checkAuthStatus = async () => {
    try {
      // 检查本地缓存
      const cached = localStorage.getItem(AUTH_CACHE_KEY)
      if (cached) {
        const authData = JSON.parse(cached)
        // 检查是否过期
        if (authData.expireTime && Date.now() < authData.expireTime) {
          setUser(authData.user)
          setLoading(false)
          setInitialized(true)
          return
        }
        // 已过期，清除
        localStorage.removeItem(AUTH_CACHE_KEY)
      }

      // 检查旧的 admin_info 缓存（兼容）
      const adminInfoStr = localStorage.getItem('admin_info')
      if (adminInfoStr) {
        try {
          const adminInfo = JSON.parse(adminInfoStr)
          const userData = {
            id: adminInfo.id,
            name: adminInfo.name,
            role: 'admin',
            type: adminInfo.type || 0
          }
          setUser(userData)
          // 迁移到新格式
          saveAuthToCache(userData)
        } catch (e) {
          localStorage.removeItem('admin_info')
        }
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  /**
   * 保存认证信息到缓存
   */
  const saveAuthToCache = (userData) => {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
      user: userData,
      expireTime: Date.now() + AUTH_EXPIRE_TIME
    }))
  }

  // 硬编码账号密码（与小程序 config.js 保持一致）
  // 注意：userId 必须与数据库中的实际用户 ID 匹配，否则 API 查询会返回空数据
  const ACCOUNTS = {
    // 管理员账号
    admin: { pwd: '123456', role: 'admin', type: 1, name: 'Admin' },
    // 微信用户账号 - userId 来自 ax_join 中的实际用户
    user: {
      pwd: '123456',
      role: 'user',
      type: 0,
      name: '测试用户',
      userId: 'oi1Jt1yz9SQ8MzgMri3ifVTKnSNk'  // 微信用户 ID，与 ax_join.JOIN_USER_ID 匹配
    },
    test: {
      pwd: '123456',
      role: 'user',
      type: 0,
      name: 'Test User',
      userId: 'oi1Jt1yz9SQ8MzgMri3ifVTKnSNk'  // 微信用户 ID
    },
    // Web 用户账号
    testuser: {
      pwd: '123456',
      role: 'user',
      type: 0,
      name: 'Web测试用户',
      userId: '20260111193257392'  // Web 用户 ID，与 ax_user.USER_ID 匹配
    },
  }

  /**
   * 统一登录接口
   * 前端硬编码验证（与小程序保持一致）
   */
  const login = async (username, password) => {
    try {
      const account = ACCOUNTS[username]

      // 验证账号密码
      if (account && account.pwd === password) {
        // 使用真实的 userId（如果配置了），否则生成默认 ID
        // 这确保 API 调用时 token 与数据库中的用户 ID 匹配
        const realUserId = account.userId || `${account.role}_${username}`

        const userData = {
          id: realUserId,
          _id: realUserId,  // 兼容性：某些地方使用 _id
          name: account.name,
          role: account.role,
          type: account.type,
        }
        setUser(userData)
        saveAuthToCache(userData)

        // 兼容旧的 admin_info 缓存（仅管理员）
        if (account.role === 'admin') {
          localStorage.setItem('admin_info', JSON.stringify({
            id: userData.id,
            name: userData.name,
            type: userData.type
          }))
        }

        return {
          success: true,
          role: account.role,
          user: userData
        }
      }

      return {
        success: false,
        message: '用户名或密码错误'
      }
    } catch (error) {
      console.error('登录失败:', error)
      return {
        success: false,
        message: error.message || '登录失败'
      }
    }
  }

  /**
   * 登出
   */
  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_CACHE_KEY)
    localStorage.removeItem('admin_info')
    localStorage.removeItem('jwt_token')
  }

  /**
   * 是否已登录
   */
  const isLoggedIn = () => {
    return !!user
  }

  /**
   * 是否是管理员
   */
  const isAdmin = () => {
    return user && user.role === 'admin'
  }

  /**
   * 是否是超级管理员
   */
  const isSuperAdmin = () => {
    return user && user.role === 'admin' && user.type === 1
  }

  /**
   * 是否是普通用户
   */
  const isUser = () => {
    return user && user.role === 'user'
  }

  /**
   * 刷新认证状态
   */
  const refreshAuth = () => {
    checkAuthStatus()
  }

  const value = {
    user,
    loading,
    initialized,
    login,
    logout,
    isLoggedIn,
    isAdmin,
    isSuperAdmin,
    isUser,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证上下文
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
