/**
 * 预约管理页面
 * Admin - Booking Management
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { callCloudRouteHTTP } from '../../../services/httpApi'
import './BookingManagement.css'

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
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

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
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

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

export default function BookingManagement() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetId = searchParams.get('meetId')
  const { isAdmin } = useAuth()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCheckin, setFilterCheckin] = useState('all')
  const [processing, setProcessing] = useState(null)
  const limit = 20

  // 加载预约列表
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        search: search || undefined,
        page,
        size: limit,
        sortType: 'sort',
        sortVal: 'timedesc'
      }

      // 如果有 meetId，添加到参数
      if (meetId) {
        params.meetId = meetId
      }

      // 状态筛选
      if (filterStatus !== 'all') {
        params.status = parseInt(filterStatus)
      }

      // 签到筛选
      if (filterCheckin !== 'all') {
        params.isCheckin = parseInt(filterCheckin)
      }

      const result = await callCloudRouteHTTP('admin/meet_join_list', params)
      setBookings(result.data?.list || [])
      setTotal(result.data?.total || 0)
    } catch (err) {
      console.error('加载预约列表失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [search, page, filterStatus, filterCheckin, meetId])

  useEffect(() => {
    if (isAdmin()) {
      loadBookings()
    }
  }, [loadBookings, isAdmin])

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    loadBookings()
  }

  // 签到操作
  const handleCheckin = async (bookingId) => {
    if (processing) return

    if (!window.confirm('确认签到核销？')) return

    try {
      setProcessing(bookingId)
      await callCloudRouteHTTP('admin/join_checkin', { id: bookingId })
      // 更新本地状态
      setBookings(prev => prev.map(b =>
        b._id === bookingId
          ? { ...b, JOIN_IS_CHECKIN: 1, JOIN_CHECKIN_TIME: new Date() }
          : b
      ))
    } catch (err) {
      console.error('签到失败:', err)
      alert('签到失败: ' + (err.message || '未知错误'))
    } finally {
      setProcessing(null)
    }
  }

  // 取消签到 - 改为切换状态
  const handleCancelCheckin = async (bookingId) => {
    if (processing) return

    if (!window.confirm('确认取消签到？')) return

    try {
      setProcessing(bookingId)
      await callCloudRouteHTTP('admin/join_status', { id: bookingId, status: 1 })
      // 更新本地状态
      setBookings(prev => prev.map(b =>
        b._id === bookingId
          ? { ...b, JOIN_IS_CHECKIN: 0, JOIN_CHECKIN_TIME: null }
          : b
      ))
    } catch (err) {
      console.error('取消签到失败:', err)
      alert('取消签到失败: ' + (err.message || '未知错误'))
    } finally {
      setProcessing(null)
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

  // 获取状态标签
  const getStatusLabel = (status) => {
    switch (status) {
      case 1: return { text: '预约成功', class: 'success' }
      case 10: return { text: '用户取消', class: 'cancelled' }
      case 99: return { text: '系统取消', class: 'cancelled' }
      default: return { text: '未知', class: '' }
    }
  }

  // 总页数
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="booking-management">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <BackIcon />
          <span>返回</span>
        </button>
        <div className="header-content">
          <h1>预约管理</h1>
          <p className="subtitle">共 {total} 条预约记录</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="搜索用户名..."
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
            <option value="1">预约成功</option>
            <option value="10">用户取消</option>
            <option value="99">系统取消</option>
          </select>

          <select
            value={filterCheckin}
            onChange={(e) => { setFilterCheckin(e.target.value); setPage(1); }}
            className="filter-select"
          >
            <option value="all">签到状态</option>
            <option value="1">已签到</option>
            <option value="0">未签到</option>
          </select>

          <button className="refresh-btn" onClick={loadBookings} disabled={loading}>
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Booking List */}
      <div className="booking-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadBookings}>重试</button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <CalendarIcon />
            <p>暂无预约记录</p>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((booking, index) => {
              const status = getStatusLabel(booking.JOIN_STATUS)
              const isCheckedIn = booking.JOIN_IS_CHECKIN === 1
              const isProcessing = processing === booking._id

              return (
                <div key={booking._id || index} className="booking-card">
                  <div className="booking-header">
                    <div className="booking-title">
                      <CalendarIcon />
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                      <span>{booking.JOIN_MEET_TITLE || '预约项目'}</span>
                    </div>
                    <div className="booking-badges">
                      {booking.JOIN_STATUS === 1 && (
                        <span className={`checkin-badge ${isCheckedIn ? 'checked' : 'unchecked'}`}>
                          {isCheckedIn ? '已签到' : '未签到'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="booking-body">
                    <div className="booking-info-grid">
                      <div className="info-row">
                        <UserIcon />
                        <span className="info-label">用户:</span>
                        <span className="info-value">{booking.JOIN_USER_NAME || booking.JOIN_USER_ID || '-'}</span>
                      </div>

                      <div className="info-row">
                        <CalendarIcon />
                        <span className="info-label">日期:</span>
                        <span className="info-value">{booking.JOIN_MEET_DAY || '-'}</span>
                      </div>

                      <div className="info-row">
                        <ClockIcon />
                        <span className="info-label">时段:</span>
                        <span className="info-value">
                          {booking.JOIN_MEET_TIME_START && booking.JOIN_MEET_TIME_END
                            ? `${booking.JOIN_MEET_TIME_START} - ${booking.JOIN_MEET_TIME_END}`
                            : '-'}
                        </span>
                      </div>

                      {booking.JOIN_REASON && (
                        <div className="info-row reason">
                          <span className="info-label">原因:</span>
                          <span className="info-value">{booking.JOIN_REASON}</span>
                        </div>
                      )}
                    </div>

                    <div className="booking-meta">
                      <span>提交时间: {formatDate(booking._createTime)}</span>
                      {isCheckedIn && booking.JOIN_CHECKIN_TIME && (
                        <span>签到时间: {formatDate(booking.JOIN_CHECKIN_TIME)}</span>
                      )}
                    </div>
                  </div>

                  {booking.JOIN_STATUS === 1 && (
                    <div className="booking-actions">
                      {isCheckedIn ? (
                        <button
                          className="action-btn cancel-checkin"
                          onClick={() => handleCancelCheckin(booking._id)}
                          disabled={isProcessing}
                        >
                          <XIcon />
                          <span>{isProcessing ? '处理中...' : '取消签到'}</span>
                        </button>
                      ) : (
                        <button
                          className="action-btn checkin"
                          onClick={() => handleCheckin(booking._id)}
                          disabled={isProcessing}
                        >
                          <CheckIcon />
                          <span>{isProcessing ? '处理中...' : '签到核销'}</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="booking-index">{index + 1}</div>
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
