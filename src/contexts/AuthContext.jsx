/**
 * 认证上下文
 * 统一管理用户登录状态、角色判断、权限检查
 * Updated: 2026-01-21 - 添加注册、Google OAuth、账户关联支持
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/authService'

// 云函数 HTTP 地址
const CLOUD_FUNCTION_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

const AuthContext = createContext(null)

// 缓存 key
const AUTH_CACHE_KEY = 'auth_info'
const AUTH_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000 // 7天

/**
 * 认证 Provider
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [authMethods, setAuthMethods] = useState([])
  const [googleEmail, setGoogleEmail] = useState(null)

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

  // 管理员账号（保留用于管理员登录）
  const ADMIN_ACCOUNTS = {
    admin: { pwd: '123456', role: 'admin', type: 1, name: 'Admin' },
  }

  /**
   * 统一登录接口
   * 管理员使用 admin/login 云函数
   * 普通用户使用 passport/login 云函数
   */
  const login = async (username, password) => {
    try {
      // 检查是否是管理员账号
      const adminAccount = ADMIN_ACCOUNTS[username]
      if (adminAccount && adminAccount.pwd === password) {
        // 管理员登录：调用 admin/login 云函数
        try {
          const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              route: 'admin/login',
              PID: 'A00',
              params: { name: username, pwd: password }
            })
          })
          const result = await response.json()

          if (result.code === 200 && result.data) {
            const data = result.data
            const userData = {
              id: data.userId,
              _id: data.userId,
              name: data.name,
              role: 'admin',
              type: data.type,
            }
            setUser(userData)
            setAuthMethods(['password'])
            saveAuthToCache(userData)

            // 保存 admin_info（包含 token）
            localStorage.setItem('admin_info', JSON.stringify({
              id: data.userId,
              name: data.name,
              type: data.type,
              token: data.jwtToken,
              legacyToken: data.token
            }))

            return { success: true, role: 'admin', user: userData }
          } else {
            return { success: false, message: result.msg || '登录失败' }
          }
        } catch (err) {
          console.error('管理员登录云函数调用失败:', err)
          return { success: false, message: '网络错误，请重试' }
        }
      }

      // 普通用户登录：调用 passport/login 云函数
      const result = await authService.loginWithCredentials(username, password)

      if (result.success) {
        const userData = {
          id: result.userId,
          _id: result.userId,
          name: result.user.name,
          username: result.user.username,
          role: 'user',
          type: 0,
          googleEmail: result.user.googleEmail,
          authMethods: result.user.authMethods
        }
        setUser(userData)
        setAuthMethods(result.user.authMethods || ['password'])
        setGoogleEmail(result.user.googleEmail || null)
        saveAuthToCache(userData)

        return { success: true, role: 'user', user: userData }
      }

      return {
        success: false,
        message: result.message || '用户名或密码错误'
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
   * 用户注册
   */
  const register = async (username, password, name) => {
    try {
      const result = await authService.register({ username, password, name })

      if (result.success) {
        const userData = {
          id: result.userId,
          _id: result.userId,
          name: result.user.name,
          username: result.user.username,
          role: 'user',
          type: 0,
          authMethods: result.user.authMethods
        }
        setUser(userData)
        setAuthMethods(result.user.authMethods || ['password'])
        saveAuthToCache(userData)

        return { success: true, user: userData }
      }

      return { success: false, message: result.message }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, message: error.message || '注册失败' }
    }
  }

  /**
   * Google OAuth 登录/注册
   * @param {string} idToken - Google ID Token (JWT)
   */
  const loginWithGoogle = async (idToken) => {
    try {
      const result = await authService.googleAuthWithIdToken(idToken)

      if (result.success) {
        const userData = {
          id: result.userId,
          _id: result.userId,
          name: result.user.name,
          username: result.user.username,
          role: 'user',
          type: 0,
          googleEmail: result.user.googleEmail,
          authMethods: result.user.authMethods
        }
        setUser(userData)
        setAuthMethods(result.user.authMethods || ['google'])
        setGoogleEmail(result.user.googleEmail || null)
        saveAuthToCache(userData)

        return {
          success: true,
          user: userData,
          isNewUser: result.isNewUser
        }
      }

      return { success: false, message: result.message }
    } catch (error) {
      console.error('Google 登录失败:', error)
      return { success: false, message: error.message || 'Google 登录失败' }
    }
  }

  /**
   * 关联 Google 账户（使用 ID Token）
   * 支持账户合并：如果 Google 账户已被其他用户使用，会自动合并
   * @param {string} idToken - Google ID Token (JWT)
   */
  const linkGoogle = async (idToken) => {
    try {
      const result = await authService.linkGoogleWithIdToken(idToken)

      if (result.success) {
        setGoogleEmail(result.googleEmail)
        setAuthMethods(result.authMethods)

        // 更新缓存中的用户信息
        if (user) {
          const updatedUser = {
            ...user,
            googleEmail: result.googleEmail,
            authMethods: result.authMethods
          }
          setUser(updatedUser)
          saveAuthToCache(updatedUser)
        }

        return {
          success: true,
          googleEmail: result.googleEmail,
          merged: result.merged,
          mergeDetails: result.mergeDetails
        }
      }

      return { success: false, message: result.message }
    } catch (error) {
      console.error('关联 Google 失败:', error)
      return { success: false, message: error.message || '关联失败' }
    }
  }

  /**
   * 取消关联 Google 账户
   */
  const unlinkGoogle = async () => {
    try {
      const result = await authService.unlinkGoogle()

      if (result.success) {
        setGoogleEmail(null)
        setAuthMethods(result.authMethods)

        // 更新缓存中的用户信息
        if (user) {
          const updatedUser = {
            ...user,
            googleEmail: null,
            authMethods: result.authMethods
          }
          setUser(updatedUser)
          saveAuthToCache(updatedUser)
        }

        return { success: true }
      }

      return { success: false, message: result.message }
    } catch (error) {
      console.error('取消关联 Google 失败:', error)
      return { success: false, message: error.message || '取消关联失败' }
    }
  }

  /**
   * 加载用户认证方式
   */
  const loadAuthMethods = async () => {
    if (!user) return

    try {
      const result = await authService.getAuthMethods()
      if (result.success) {
        setAuthMethods(result.methods)
        setGoogleEmail(result.googleEmail)
      }
    } catch (error) {
      console.error('加载认证方式失败:', error)
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
    authMethods,
    googleEmail,
    login,
    register,
    loginWithGoogle,
    linkGoogle,
    unlinkGoogle,
    loadAuthMethods,
    logout,
    isLoggedIn,
    isAdmin,
    isSuperAdmin,
    isUser,
    refreshAuth,
    // 便捷方法
    hasPasswordAuth: authMethods.includes('password'),
    hasGoogleAuth: authMethods.includes('google'),
    canUnlinkGoogle: authMethods.length > 1 && authMethods.includes('google')
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
