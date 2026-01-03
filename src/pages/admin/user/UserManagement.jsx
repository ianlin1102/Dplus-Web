/**
 * 用户管理页面
 * Admin - User Management
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { getStudentList } from '../../../services/databaseService'
import './UserManagement.css'

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

export default function UserManagement() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const limit = 20

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getStudentList({
        search,
        page,
        limit
      })

      // 根据排序方式处理数据
      let sortedList = [...(result.list || [])]
      if (sortBy === 'oldest') {
        sortedList.reverse()
      }

      setUsers(sortedList)
      setTotal(result.total || 0)
    } catch (err) {
      console.error('加载用户列表失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [search, page, sortBy])

  useEffect(() => {
    if (isAdmin()) {
      loadUsers()
    }
  }, [loadUsers, isAdmin])

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 总页数
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="user-management">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <BackIcon />
          <span>返回</span>
        </button>
        <div className="header-content">
          <h1>用户管理</h1>
          <p className="subtitle">共 {total} 位注册用户</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="搜索用户名、手机号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn">搜索</button>
        </form>

        <div className="filter-group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">最新注册</option>
            <option value="oldest">最早注册</option>
          </select>

          <button className="refresh-btn" onClick={loadUsers} disabled={loading}>
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="user-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadUsers}>重试</button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <UserIcon />
            <p>暂无用户数据</p>
          </div>
        ) : (
          <div className="user-grid">
            {users.map((user, index) => (
              <div key={user._id || index} className="user-card">
                <div className="user-avatar">
                  {user.USER_NAME?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.USER_NAME || '未设置昵称'}</h3>
                  <div className="user-details">
                    <div className="detail-item">
                      <PhoneIcon />
                      <span>{user.USER_MOBILE || '未绑定手机'}</span>
                    </div>
                    <div className="detail-item">
                      <CalendarIcon />
                      <span>注册: {formatDate(user.USER_ADD_TIME || user._createTime)}</span>
                    </div>
                  </div>
                  {(user.USER_CITY || user.USER_WORK) && (
                    <div className="user-extra">
                      {user.USER_CITY && <span className="tag">{user.USER_CITY}</span>}
                      {user.USER_WORK && <span className="tag">{user.USER_WORK}</span>}
                    </div>
                  )}
                </div>
                <div className={`user-status ${user.USER_STATUS === 1 ? 'active' : 'inactive'}`}>
                  {user.USER_STATUS === 1 ? '正常' : '禁用'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeftIcon />
          </button>
          <span className="page-info">
            {page} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  )
}
