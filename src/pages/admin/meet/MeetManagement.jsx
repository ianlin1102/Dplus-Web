/**
 * 活动/预约管理页面
 * Admin - Meet/Course Management
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { getCourseList, updateCourse } from '../../../services/databaseService'
import './MeetManagement.css'

// Icons
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
  </svg>
)

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
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

export default function MeetManagement() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [meets, setMeets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('all')
  const [processing, setProcessing] = useState(null)
  const limit = 20

  // 加载活动列表
  const loadMeets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const options = {
        search,
        page,
        limit
      }

      // 状态筛选
      if (filterStatus !== 'all') {
        options.status = parseInt(filterStatus)
      }

      const result = await getCourseList(options)
      setMeets(result.list || [])
      setTotal(result.total || 0)
    } catch (err) {
      console.error('加载活动列表失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [search, page, filterStatus])

  useEffect(() => {
    if (isAdmin()) {
      loadMeets()
    }
  }, [loadMeets, isAdmin])

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadMeets()
  }

  // 切换状态
  const handleStatusChange = async (meetId, newStatus) => {
    if (processing) return

    const statusText = {
      0: '未启用',
      1: '使用中',
      9: '停止',
      10: '已关闭'
    }

    if (!window.confirm(`确认将状态改为"${statusText[newStatus]}"？`)) return

    try {
      setProcessing(meetId)
      await updateCourse(meetId, { MEET_STATUS: newStatus })
      setMeets(prev => prev.map(m =>
        m._id === meetId ? { ...m, MEET_STATUS: newStatus } : m
      ))
    } catch (err) {
      console.error('更新状态失败:', err)
      alert('更新失败: ' + (err.message || '未知错误'))
    } finally {
      setProcessing(null)
    }
  }

  // 获取状态标签
  const getStatusLabel = (status) => {
    switch (status) {
      case 0: return { text: '未启用', class: 'inactive' }
      case 1: return { text: '使用中', class: 'active' }
      case 9: return { text: '停止', class: 'stopped' }
      case 10: return { text: '已关闭', class: 'closed' }
      default: return { text: '未知', class: '' }
    }
  }

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 总页数
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="meet-management">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <BackIcon />
          <span>返回</span>
        </button>
        <div className="header-content">
          <h1>活动/预约管理</h1>
          <p className="subtitle">共 {total} 个活动</p>
        </div>
        <button onClick={loadMeets} className="refresh-btn" disabled={loading}>
          <RefreshIcon />
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="搜索活动标题..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn">搜索</button>
        </form>

        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="filter-select"
          >
            <option value="all">全部状态</option>
            <option value="1">使用中</option>
            <option value="0">未启用</option>
            <option value="9">停止</option>
            <option value="10">已关闭</option>
          </select>
        </div>
      </div>

      {/* Meet List */}
      <div className="meet-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadMeets}>重试</button>
          </div>
        ) : meets.length === 0 ? (
          <div className="empty-state">
            <CalendarIcon />
            <p>暂无活动数据</p>
          </div>
        ) : (
          <div className="meet-list">
            {meets.map((meet, index) => {
              const status = getStatusLabel(meet.MEET_STATUS)
              const isProcessing = processing === meet._id

              return (
                <div key={meet._id || index} className="meet-card">
                  <div className="meet-header">
                    <div className="meet-title">
                      {meet.MEET_ORDER === 0 && <span className="pin-tag">[置顶]</span>}
                      <span>{meet.MEET_TITLE || '未命名活动'}</span>
                    </div>
                    <span className={`status-badge ${status.class}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="meet-body">
                    <div className="meet-info-grid">
                      <div className="info-row">
                        <span className="info-label">分类:</span>
                        <span className="info-value">{meet.MEET_TYPE_NAME || '默认'}</span>
                      </div>

                      <div className="info-row">
                        <span className="info-label">最大人数:</span>
                        <span className="info-value">{meet.MEET_MAX_CNT || 0} 人</span>
                      </div>

                      <div className="info-row">
                        <span className="info-label">排序:</span>
                        <span className="info-value">{meet.MEET_ORDER || 0}</span>
                      </div>

                      <div className="info-row">
                        <span className="info-label">更新时间:</span>
                        <span className="info-value">{formatDate(meet._updateTime || meet._createTime)}</span>
                      </div>
                    </div>

                    {meet.MEET_CONTENT && (
                      <div className="meet-desc">
                        {meet.MEET_CONTENT.substring(0, 100)}
                        {meet.MEET_CONTENT.length > 100 && '...'}
                      </div>
                    )}
                  </div>

                  <div className="meet-actions">
                    <button className="action-btn settings" disabled={isProcessing}>
                      <SettingsIcon />
                      <span>设置</span>
                    </button>

                    <button
                      className="action-btn list"
                      onClick={() => navigate(`/admin/bookings?meetId=${meet._id}`)}
                      disabled={isProcessing}
                    >
                      <ListIcon />
                      <span>名单</span>
                    </button>

                    <div className="status-dropdown">
                      <select
                        value={meet.MEET_STATUS}
                        onChange={(e) => handleStatusChange(meet._id, parseInt(e.target.value))}
                        disabled={isProcessing}
                        className="status-select"
                      >
                        <option value={0}>未启用</option>
                        <option value={1}>使用中</option>
                        <option value={9}>停止</option>
                        <option value={10}>已关闭</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
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
