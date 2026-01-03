/**
 * 路由保护组件
 * 根据用户角色控制页面访问权限
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * 需要登录的路由保护
 * @param {ReactNode} children - 子组件
 * @param {string} redirectTo - 未登录时重定向的路径
 */
export function RequireAuth({ children, redirectTo = '/login' }) {
  const { user, loading, initialized } = useAuth()
  const location = useLocation()

  // 加载中显示 loading
  if (loading || !initialized) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  // 未登录，重定向到登录页
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return children
}

/**
 * 需要管理员权限的路由保护
 * @param {ReactNode} children - 子组件
 * @param {boolean} requireSuper - 是否需要超级管理员权限
 */
export function RequireAdmin({ children, requireSuper = false }) {
  const { user, loading, initialized, isAdmin, isSuperAdmin } = useAuth()
  const location = useLocation()

  // 加载中显示 loading
  if (loading || !initialized) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  // 未登录，重定向到登录页
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 不是管理员，重定向到用户 Dashboard
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  // 需要超级管理员但不是超级管理员
  if (requireSuper && !isSuperAdmin()) {
    return (
      <div className="access-denied">
        <h1>权限不足</h1>
        <p>此操作需要超级管理员权限</p>
        <a href="#/admin/dashboard">返回管理后台</a>
      </div>
    )
  }

  return children
}

/**
 * 需要普通用户权限的路由保护
 * @param {ReactNode} children - 子组件
 */
export function RequireUser({ children }) {
  const { user, loading, initialized, isUser, isAdmin } = useAuth()
  const location = useLocation()

  // 加载中显示 loading
  if (loading || !initialized) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  // 未登录，重定向到登录页
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 是管理员，重定向到管理员 Dashboard
  if (isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

/**
 * 根据角色自动路由
 * 登录后根据角色跳转到对应的 Dashboard
 */
export function RoleBasedRedirect() {
  const { user, loading, initialized, isAdmin } = useAuth()

  // 加载中
  if (loading || !initialized) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  // 未登录
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 根据角色跳转
  if (isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Navigate to="/dashboard" replace />
}

export default {
  RequireAuth,
  RequireAdmin,
  RequireUser,
  RoleBasedRedirect
}
