/**
 * 管理员登录页面
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../../services/adminService'
import './AdminLogin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)

    try {
      const result = await login(username, password)

      if (result.success) {
        // 登录成功，跳转到仪表盘
        navigate('/admin/dashboard')
      } else {
        setError(result.message || '登录失败')
      }
    } catch (err) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>管理后台</h1>
          <p>欢迎回来，请登录您的账户</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-footer">
          <p>舞社管理系统 v1.0</p>
        </div>
      </div>
    </div>
  )
}
