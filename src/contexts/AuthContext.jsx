/**
 * 认证上下文
 * 统一管理用户登录状态、角色判断、权限检查
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  initDatabase,
  getDatabase,
  adminLogin as dbAdminLogin,
  adminLogout as dbAdminLogout,
  getCurrentAdmin
} from '../services/databaseService'

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
      const adminInfo = getCurrentAdmin()
      if (adminInfo) {
        const userData = {
          id: adminInfo.id,
          name: adminInfo.name,
          role: 'admin',
          type: adminInfo.type || 0
        }
        setUser(userData)
        // 迁移到新格式
        saveAuthToCache(userData)
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

  /**
   * 统一登录接口
   * 支持管理员和普通用户
   */
  const login = async (username, password) => {
    try {
      await initDatabase()
      const db = getDatabase()

      // 1. 尝试管理员登录
      const adminResult = await db.collection('ax_admin')
        .where({
          ADMIN_NAME: username,
          ADMIN_PASSWORD: password,
          ADMIN_STATUS: 1
        })
        .get()

      if (adminResult.data && adminResult.data.length > 0) {
        const admin = adminResult.data[0]
        const userData = {
          id: admin._id,
          name: admin.ADMIN_NAME,
          role: 'admin',
          type: admin.ADMIN_TYPE || 0, // 0=普通管理员, 1=超级管理员
          phone: admin.ADMIN_PHONE || ''
        }
        setUser(userData)
        saveAuthToCache(userData)

        // 兼容旧的 admin_info 缓存
        localStorage.setItem('admin_info', JSON.stringify({
          id: admin._id,
          name: admin.ADMIN_NAME,
          type: admin.ADMIN_TYPE
        }))

        return {
          success: true,
          role: 'admin',
          user: userData
        }
      }

      // 2. 尝试普通用户登录
      const userResult = await db.collection('ax_user')
        .where({
          USER_ACCOUNT: username,
          USER_PASSWORD: password,
          USER_STATUS: 1
        })
        .get()

      if (userResult.data && userResult.data.length > 0) {
        const dbUser = userResult.data[0]
        const userData = {
          id: dbUser._id,
          name: dbUser.USER_NAME || dbUser.USER_ACCOUNT,
          role: 'user',
          phone: dbUser.USER_PHONE || '',
          avatar: dbUser.USER_PIC || ''
        }
        setUser(userData)
        saveAuthToCache(userData)

        return {
          success: true,
          role: 'user',
          user: userData
        }
      }

      // 登录失败
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
    dbAdminLogout()
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
