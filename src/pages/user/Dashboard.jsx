import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom'
import { Home, Calendar, CreditCard, Settings, Activity, User, Menu, X, Edit2, Save, Loader2, Clock, XCircle, AlertCircle, CalendarOff, RefreshCw, Info, Coins, CheckCircle, LogOut, Link2, Unlink, ShoppingCart, FileText, ChevronRight, Sun, Moon, Globe } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/AuthContext'
import { getMyJoinList, cancelMyJoin, canCancelBooking, formatCancelRule } from '../../services/bookingService'
import { getMyCards, getPurchaseHistory } from '../../services/cardService'
import { getMyDetail, editUserBase } from '../../services/api'
import './Dashboard.css'

// 角色配置
const ROLE_CONFIG = {
  admin: {
    zh: '管理员', en: 'Admin',
    icon: '★',
    color: '#ff6b6b',
    gradientStart: '#d63031', gradientEnd: '#ff6b6b',
  },
  staff: {
    zh: '员工', en: 'Staff',
    icon: '◆',
    color: '#f0c040',
    gradientStart: '#e67e22', gradientEnd: '#f0c040',
  },
  student: {
    zh: '学员', en: 'Student',
    icon: '●',
    color: '#00f2ff',
    gradientStart: '#00c8d6', gradientEnd: '#00f2ff',
  },
}

/** 根据 authUser 推断角色 */
const getUserRole = (authUser) => {
  if (authUser?.role === 'admin') {
    return authUser.type === 1 ? 'admin' : 'staff'
  }
  return 'student'
}

// Dashboard Overview Component
const DashboardOverview = () => {
  const { t, language } = useLanguage()
  const { user: authUser } = useAuth()
  const userRole = getUserRole(authUser)
  const roleConfig = ROLE_CONFIG[userRole]
  const [cardStats, setCardStats] = useState({ totalTimes: 0, totalBalance: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [recentPurchases, setRecentPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  // 加载卡项汇总、最近预约和购买记录
  useEffect(() => {
    const loadData = async () => {
      if (!authUser?._id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // 并行加载卡项、预约和购买记录
        const [cards, bookingsResult, purchases] = await Promise.all([
          getMyCards(authUser._id, { includeExpired: false }),
          getMyJoinList({ sortType: 'timedesc', page: 1, size: 5 }),
          getPurchaseHistory(authUser._id).catch(() => [])
        ])

        // 计算卡项汇总
        // 正确字段名：USER_CARD_REMAIN_TIMES (次数), USER_CARD_REMAIN_AMOUNT (余额)
        let totalTimes = 0
        let totalBalance = 0
        cards.forEach(card => {
          if (card.USER_CARD_TYPE === 1) {
            // 次数卡
            totalTimes += card.USER_CARD_REMAIN_TIMES || 0
          } else if (card.USER_CARD_TYPE === 2) {
            // 余额卡
            totalBalance += card.USER_CARD_REMAIN_AMOUNT || 0
          }
        })
        setCardStats({ totalTimes, totalBalance })

        // 设置最近预约
        if (bookingsResult.code === 200) {
          setRecentBookings(bookingsResult.data?.list || [])
        }

        // 设置最近购买记录（只显示前5条）
        setRecentPurchases((purchases || []).slice(0, 5))
      } catch (err) {
        console.error('加载数据失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authUser?._id])

  // 格式化预约为活动项
  const formatBookingActivity = (booking) => {
    const statusMap = {
      1: { zh: '已预约', en: 'Booked', type: 'booking' },
      10: { zh: '已取消', en: 'Cancelled', type: 'cancelled' },
      99: { zh: '系统取消', en: 'System Cancelled', type: 'cancelled' },
    }
    const isCheckin = booking.JOIN_IS_CHECKIN === 1
    const status = isCheckin
      ? { zh: '已签到', en: 'Checked In', type: 'checkin' }
      : (statusMap[booking.JOIN_STATUS] || statusMap[1])

    // Extract numeric date
    let dateStr = booking.JOIN_MEET_DAY || ''
    const cnMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    const isoMatch = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
    const weekMatch = dateStr.match(/[（(](周.)[）)]/)
    const m = cnMatch || isoMatch
    if (m) {
      if (language === 'zh') {
        // 中文: 3/5 (周四)
        dateStr = `${parseInt(m[2])}/${parseInt(m[3])}` + (weekMatch ? ` (${weekMatch[1]})` : '')
      } else {
        // EN: 2026/3/5
        dateStr = `${m[1]}/${parseInt(m[2])}/${parseInt(m[3])}`
      }
    }

    return {
      date: dateStr,
      event: booking.JOIN_MEET_TITLE,
      status: language === 'zh' ? status.zh : status.en,
      type: status.type
    }
  }

  return (
    <div className="dashboard-content">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{t('dashboard.title')}</h1>
          <p className="dashboard-subtitle">{t('dashboard.welcome')}, {authUser?.name || (language === 'zh' ? '用户' : 'User')}</p>
        </div>
        <div className="header-date">
          <span className="date-text">{(() => { const d = new Date(); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}` })()}</span>
        </div>
      </header>

      {/* 角色卡片 */}
      <div className={`role-card role-card--${userRole}`} style={{ '--role-color': roleConfig.color, '--role-gradient-start': roleConfig.gradientStart, '--role-gradient-end': roleConfig.gradientEnd }}>
        <div className="role-card-content">
          <span className="role-card-icon">{roleConfig.icon}</span>
          <div className="role-card-info">
            <span className="role-card-name">{authUser?.name || (language === 'zh' ? '用户' : 'User')}</span>
            <span className="role-card-label">{language === 'zh' ? roleConfig.zh : roleConfig.en}</span>
          </div>
        </div>
      </div>

      {/* 卡项汇总 Stats Grid */}
      <div className="stats-section">
        <h3 className="stats-title">{t('dashboard.cardSummary')}</h3>
        <div className="stats-grid">
          <div className="stat-card neon-border-cyan">
            <span className="stat-label">{t('dashboard.totalTimes')}</span>
            <span className="stat-value text-cyan">
              {loading ? '-' : cardStats.totalTimes}
            </span>
            <span className="stat-unit">{language === 'zh' ? '次' : 'classes'}</span>
          </div>
          <div className="stat-card neon-border-pink">
            <span className="stat-label">{t('dashboard.totalBalance')}</span>
            <span className="stat-value text-pink">
              {loading ? '-' : `¥${cardStats.totalBalance}`}
            </span>
            <span className="stat-unit">{language === 'zh' ? '元' : 'CNY'}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-card">
        <h3 className="activity-title">{t('dashboard.recentActivity')}</h3>
        <div className="activity-list">
          {loading ? (
            <div className="activity-item">
              <span className="activity-event" style={{ opacity: 0.5 }}>
                {language === 'zh' ? '加载中...' : 'Loading...'}
              </span>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="activity-item">
              <span className="activity-event" style={{ opacity: 0.5 }}>
                {language === 'zh' ? '暂无活动' : 'No recent activity'}
              </span>
            </div>
          ) : (
            recentBookings.map((booking, index) => {
              const activity = formatBookingActivity(booking)
              return (
                <div key={booking._id || index} className="activity-item">
                  <span className="activity-date">{activity.date}</span>
                  <span className="activity-event">{activity.event}</span>
                  <span className={`activity-status ${
                    activity.type === 'checkin' ? 'status-cyan' :
                    activity.type === 'purchase' ? 'status-pink' :
                    activity.type === 'booking' ? 'status-green' :
                    'status-muted'
                  }`}>{activity.status}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Purchase History */}
      <div className="activity-card">
        <h3 className="activity-title">
          {language === 'zh' ? '购买记录' : 'Purchase History'}
        </h3>
        <div className="activity-list">
          {loading ? (
            <div className="activity-item">
              <span className="activity-event" style={{ opacity: 0.5 }}>
                {language === 'zh' ? '加载中...' : 'Loading...'}
              </span>
            </div>
          ) : recentPurchases.length === 0 ? (
            <div className="activity-item">
              <span className="activity-event" style={{ opacity: 0.5 }}>
                {language === 'zh' ? '暂无购买记录' : 'No purchase history'}
              </span>
            </div>
          ) : (
            recentPurchases.map((purchase, index) => {
              // 格式化日期
              const formatDate = (timestamp) => {
                if (!timestamp) return ''
                const d = new Date(timestamp)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }
              // 状态映射: 0=待支付, 1=待确认, 2=已同意, -1=已取消, -2=已拒绝
              const statusMap = {
                0: { zh: '待支付', en: 'Pending', class: 'status-muted' },
                1: { zh: '待确认', en: 'Awaiting', class: 'status-yellow' },
                2: { zh: '已同意', en: 'Approved', class: 'status-green' },
                '-1': { zh: '已取消', en: 'Cancelled', class: 'status-muted' },
                '-2': { zh: '已拒绝', en: 'Rejected', class: 'status-red' },
                3: { zh: '已取消', en: 'Cancelled', class: 'status-muted' }, // 兼容旧数据
              }
              const status = statusMap[String(purchase.PURCHASE_STATUS)] || statusMap[0]
              return (
                <div key={purchase._id || index} className="activity-item">
                  <span className="activity-date">{formatDate(purchase.PURCHASE_ADD_TIME)}</span>
                  <span className="activity-event">
                    {purchase.PURCHASE_CARD_TITLE || (language === 'zh' ? '卡项' : 'Card')}
                  </span>
                  <span className="activity-price">${purchase.PURCHASE_CARD_PRICE || 0}</span>
                  <span className={`activity-status ${status.class}`}>
                    {language === 'zh' ? status.zh : status.en}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}


// My cards data
const myCards = {
  zh: [
    { id: 1, name: '10次卡', type: '次数卡', remaining: 8, total: 10, expiry: '2026-06-01', color: '#06b6d4' },
    { id: 2, name: '余额卡 500', type: '余额卡', remaining: 280, total: 500, expiry: '2026-12-31', color: '#d946ef' },
  ],
  en: [
    { id: 1, name: '10 Class Pack', type: 'Class Pack', remaining: 8, total: 10, expiry: '2026-06-01', color: '#06b6d4' },
    { id: 2, name: '$500 Credit', type: 'Credit Card', remaining: 280, total: 500, expiry: '2026-12-31', color: '#d946ef' },
  ],
}

// 筛选选项
const FILTER_OPTIONS = [
  { key: 'timedesc', zh: '全部', en: 'All' },
  { key: 'today', zh: '今日', en: 'Today' },
  { key: 'tomorrow', zh: '明日', en: 'Tomorrow' },
  { key: 'succ', zh: '已预约', en: 'Booked' },
  { key: 'cancel', zh: '已取消', en: 'Cancelled' },
]

// Sub-page components
// 检查预约是否已过期
const isBookingExpired = (booking) => {
  if (!booking.JOIN_MEET_DAY || !booking.JOIN_MEET_TIME_END) return false
  try {
    // 组合日期和结束时间，格式如 "2026-01-20 18:00"
    const endDateTimeStr = `${booking.JOIN_MEET_DAY} ${booking.JOIN_MEET_TIME_END}`
    const endDateTime = new Date(endDateTimeStr.replace(/-/g, '/')) // 兼容 Safari
    return endDateTime < new Date()
  } catch {
    return false
  }
}

// 截断显示名字（中英文混合计算）
const truncateName = (name, maxLength = 8) => {
  if (!name) return ''
  // 计算字符宽度：中文算2，英文算1
  let width = 0
  let result = ''
  for (const char of name) {
    const charWidth = /[\u4e00-\u9fa5]/.test(char) ? 2 : 1
    if (width + charWidth > maxLength * 2) {
      return result + '...'
    }
    width += charWidth
    result += char
  }
  return result
}

const MySchedule = () => {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [filter, setFilter] = useState('timedesc')
  const [successMessage, setSuccessMessage] = useState(location.state?.success ? (language === 'zh' ? '预约成功！' : 'Booking confirmed!') : null)

  // 加载预约列表
  const loadBookings = async (sortType = filter) => {
    if (!user?._id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await getMyJoinList({ sortType, page: 1, size: 50 })

      if (result.code === 200) {
        setBookings(result.data?.list || [])
      } else {
        setError(result.msg || (language === 'zh' ? '获取预约列表失败' : 'Failed to load bookings'))
      }
    } catch (err) {
      console.error('加载预约列表失败:', err)
      setError(language === 'zh' ? '加载失败，请重试' : 'Failed to load, please try again')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [user?._id])

  // 筛选变化时重新加载
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    loadBookings(newFilter)
  }

  // 清除成功消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // 取消预约
  const handleCancel = async (booking) => {
    // 使用后端返回的 canCancel 字段
    if (!booking.canCancel) {
      const msg = language === 'zh' ? '该预约无法取消' : 'This booking cannot be cancelled'
      alert(msg)
      return
    }

    // 检查是否有卡项扣费记录
    const hasCardDeduct = booking.JOIN_CARD_DEDUCT && !booking.JOIN_CARD_DEDUCT.refunded
    let confirmMsg = language === 'zh'
      ? `确定要取消预约「${booking.JOIN_MEET_TITLE}」吗？`
      : `Are you sure you want to cancel "${booking.JOIN_MEET_TITLE}"?`

    // 如果有卡项扣费，提示会退还
    if (hasCardDeduct) {
      const deduct = booking.JOIN_CARD_DEDUCT
      const refundInfo = deduct.cardType === 'times'
        ? (language === 'zh' ? `${deduct.deductAmount}次` : `${deduct.deductAmount} class(es)`)
        : (language === 'zh' ? `¥${deduct.deductAmount}` : `¥${deduct.deductAmount}`)
      confirmMsg += language === 'zh'
        ? `\n\n取消后将退还: ${refundInfo}`
        : `\n\nRefund: ${refundInfo}`
    }

    if (!window.confirm(confirmMsg)) return

    try {
      setCancellingId(booking._id)
      const result = await cancelMyJoin(booking._id)

      if (result.code === 200) {
        // 根据是否有退还显示不同消息
        const msg = hasCardDeduct
          ? (language === 'zh' ? '预约已取消，卡项已退还' : 'Booking cancelled, card refunded')
          : (language === 'zh' ? '预约已取消' : 'Booking cancelled')
        setSuccessMessage(msg)
        loadBookings() // 刷新列表
      } else {
        alert(result.msg || (language === 'zh' ? '取消失败' : 'Cancel failed'))
      }
    } catch (err) {
      console.error('取消预约失败:', err)
      alert(language === 'zh' ? '取消失败，请重试' : 'Cancel failed, please try again')
    } finally {
      setCancellingId(null)
    }
  }

  // 获取状态显示 - 使用正确的状态值
  const getStatusDisplay = (status, isCheckin, isExpired = false) => {
    // 已签到
    if (isCheckin === 1) {
      return { zh: '已签到', en: 'Checked In', class: 'checkedin' }
    }
    // 已过期（预约成功但时间已过）
    if (isExpired && status === 1) {
      return { zh: '已过期', en: 'Expired', class: 'expired' }
    }
    // 状态映射：1=预约成功, 10=已取消, 99=系统取消
    const statusMap = {
      1: { zh: '已预约', en: 'Booked', class: 'confirmed' },
      10: { zh: '已取消', en: 'Cancelled', class: 'cancelled' },
      99: { zh: '系统取消', en: 'System Cancelled', class: 'cancelled' },
    }
    return statusMap[status] || { zh: '未知', en: 'Unknown', class: 'pending' }
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="dashboard-content">
        <h1 className="dashboard-title">{t('dashboard.myBookings')}</h1>
        <p className="dashboard-subtitle">MY BOOKINGS</p>
        <div className="loading-state">
          <Loader2 className="spin" size={32} />
          <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div className="schedule-header">
        <div>
          <h1 className="dashboard-title">{t('dashboard.myBookings')}</h1>
          <p className="dashboard-subtitle">MY BOOKINGS</p>
        </div>
        <button className="refresh-btn" onClick={() => loadBookings()} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* 筛选菜单 */}
      <div className="filter-tabs">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`filter-tab ${filter === opt.key ? 'active' : ''}`}
            onClick={() => handleFilterChange(opt.key)}
          >
            {language === 'zh' ? opt.zh : opt.en}
          </button>
        ))}
      </div>

      {/* 成功消息 */}
      {successMessage && (
        <div className="success-message">
          <AlertCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 错误消息 */}
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 预约列表 */}
      {bookings.length === 0 ? (
        <div className="empty-bookings">
          <CalendarOff size={48} />
          <p>{language === 'zh' ? '暂无预约' : 'No bookings yet'}</p>
          <a href="#/calendar" className="book-now-link">
            {language === 'zh' ? '去预约课程' : 'Book a class'}
          </a>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const isExpired = isBookingExpired(booking)
            const statusInfo = getStatusDisplay(booking.JOIN_STATUS, booking.JOIN_IS_CHECKIN, isExpired)
            const isCancelling = cancellingId === booking._id
            // 只有预约成功(1)且未签到且未过期的才能取消
            const showCancelBtn = booking.canCancel && booking.JOIN_STATUS === 1 && booking.JOIN_IS_CHECKIN !== 1 && !isExpired

            // 格式化卡项扣费信息
            const getDeductInfo = () => {
              if (!booking.JOIN_CARD_DEDUCT) return null
              const deduct = booking.JOIN_CARD_DEDUCT
              if (deduct.cardType === 'times') {
                return language === 'zh'
                  ? `已扣 ${deduct.deductAmount} 次`
                  : `${deduct.deductAmount} class(es) deducted`
              }
              return language === 'zh'
                ? `已扣 ¥${deduct.deductAmount}`
                : `¥${deduct.deductAmount} deducted`
            }

            // 格式化取消规则
            const getCancelRuleHint = () => {
              if (!booking.canCancel || !booking.cancelSet) return null
              const cancelSet = booking.cancelSet
              if (!cancelSet.isLimit) {
                return language === 'zh' ? '可随时取消' : 'Can cancel anytime'
              }
              if (cancelSet.days === -1) {
                return language === 'zh' ? '不可取消' : 'Cannot cancel'
              }
              let parts = []
              if (cancelSet.days > 0) parts.push(`${cancelSet.days}${language === 'zh' ? '天' : 'd'}`)
              if (cancelSet.hours > 0) parts.push(`${cancelSet.hours}${language === 'zh' ? '小时' : 'h'}`)
              if (cancelSet.minutes > 0) parts.push(`${cancelSet.minutes}${language === 'zh' ? '分钟' : 'm'}`)
              return language === 'zh'
                ? `需提前 ${parts.join('')} 取消`
                : `Cancel ${parts.join('')} before`
            }

            const deductInfo = getDeductInfo()
            const cancelRuleHint = getCancelRuleHint()

            return (
              <div key={booking._id} className={`booking-card ${statusInfo.class} ${isExpired ? 'expired' : ''}`}>
                <div className="booking-info">
                  <h3 className="booking-name">{booking.JOIN_MEET_TITLE}</h3>
                  <p className="booking-meta">
                    <Calendar size={14} />
                    <span>{booking.JOIN_MEET_DAY}</span>
                    <Clock size={14} style={{ marginLeft: '0.5rem' }} />
                    <span>{booking.JOIN_MEET_TIME_START} - {booking.JOIN_MEET_TIME_END}</span>
                  </p>
                  {booking.JOIN_INSTRUCTOR_NAME && (
                    <p className="booking-instructor">
                      <User size={14} />
                      {booking.JOIN_INSTRUCTOR_NAME}
                    </p>
                  )}
                  {/* 卡项扣费信息 */}
                  {deductInfo && (
                    <p className="booking-deduct">
                      <Coins size={14} />
                      <span>{deductInfo}</span>
                      {booking.JOIN_CARD_DEDUCT?.refunded && (
                        <span className="refunded-tag">
                          {language === 'zh' ? '已退还' : 'Refunded'}
                        </span>
                      )}
                    </p>
                  )}
                  {/* 取消规则提示 */}
                  {cancelRuleHint && booking.JOIN_STATUS === 1 && (
                    <p className="booking-cancel-hint">
                      <Info size={12} />
                      <span>{cancelRuleHint}</span>
                    </p>
                  )}
                </div>
                <div className="booking-actions">
                  <span className={`booking-status ${statusInfo.class}`}>
                    {language === 'zh' ? statusInfo.zh : statusInfo.en}
                  </span>
                  {showCancelBtn && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancel(booking)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      <span>{language === 'zh' ? '取消' : 'Cancel'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const Wallet = () => {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载用户卡项
  useEffect(() => {
    const loadCards = async () => {
      if (!user?._id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await getMyCards(user._id, { includeExpired: false })
        setCards(result || [])
      } catch (err) {
        console.error('加载卡项失败:', err)
        setError(language === 'zh' ? '加载失败，请重试' : 'Failed to load, please try again')
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [user?._id])

  // 格式化日期
  const formatExpiry = (timestamp) => {
    if (!timestamp) return language === 'zh' ? '永久有效' : 'Never expires'
    const date = new Date(timestamp)
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')
  }

  // 获取卡项类型和颜色
  const getCardTypeInfo = (card) => {
    // USER_CARD_TYPE: 1=次数卡, 2=余额卡
    // 正确字段：USER_CARD_REMAIN_TIMES, USER_CARD_TOTAL_TIMES, USER_CARD_REMAIN_AMOUNT, USER_CARD_TOTAL_AMOUNT
    const isTimesCard = card.USER_CARD_TYPE === 1
    if (isTimesCard) {
      return {
        type: language === 'zh' ? '次数卡' : 'Class Pack',
        color: '#06b6d4',
        remaining: card.USER_CARD_REMAIN_TIMES || 0,
        total: card.USER_CARD_TOTAL_TIMES || 0,
        unit: language === 'zh' ? '次' : 'classes',
        isBalance: false
      }
    } else {
      return {
        type: language === 'zh' ? '余额卡' : 'Credit Card',
        color: '#d946ef',
        remaining: card.USER_CARD_REMAIN_AMOUNT || 0,
        total: card.USER_CARD_TOTAL_AMOUNT || 0,
        unit: '',
        isBalance: true
      }
    }
  }

  if (loading) {
    return (
      <div className="dashboard-content">
        <h1 className="dashboard-title">{t('dashboard.myCards')}</h1>
        <p className="dashboard-subtitle">MY CARDS</p>
        <div className="loading-state">
          <Loader2 className="spin" size={32} />
          <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">{t('dashboard.myCards')}</h1>
      <p className="dashboard-subtitle">MY CARDS</p>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="empty-bookings">
          <CreditCard size={48} />
          <p>{language === 'zh' ? '暂无卡项' : 'No cards yet'}</p>
          <a href="#/store" className="book-now-link">
            {language === 'zh' ? '去购买卡项' : 'Buy cards'}
          </a>
        </div>
      ) : (
        <div className="cards-list">
          {cards.map((card) => {
            const cardInfo = getCardTypeInfo(card)
            const progress = cardInfo.total > 0 ? (cardInfo.remaining / cardInfo.total) * 100 : 0

            return (
              <div key={card._id} className="wallet-card" style={{ '--card-color': cardInfo.color }}>
                <div className="wallet-card-header">
                  <span className="card-type-tag" style={{ background: cardInfo.color }}>{cardInfo.type}</span>
                  <span className="card-expiry">
                    {t('dashboard.validUntil')} {formatExpiry(card.USER_CARD_EXPIRE_TIME)}
                  </span>
                </div>
                <h3 className="wallet-card-name">{card.USER_CARD_CARD_NAME || cardInfo.type}</h3>
                <div className="wallet-card-balance">
                  <span className="balance-value" style={{ color: cardInfo.color }}>
                    {cardInfo.isBalance ? `¥${cardInfo.remaining}` : cardInfo.remaining}
                  </span>
                  <span className="balance-total">
                    / {cardInfo.isBalance ? `¥${cardInfo.total}` : `${cardInfo.total} ${cardInfo.unit}`}
                  </span>
                </div>
                <div className="wallet-progress">
                  <div
                    className="wallet-progress-fill"
                    style={{
                      width: `${progress}%`,
                      background: cardInfo.color
                    }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Google OAuth Configuration for account linking
const GOOGLE_CLIENT_ID = '574240389068-uf3u8v3hp2rd1kj642hf81as4uubdmba.apps.googleusercontent.com'
const GOOGLE_REDIRECT_URI = `${window.location.origin}/oauth-callback.html`
const GOOGLE_SCOPE = 'openid email profile'

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const SettingsPage = () => {
  const { t, language } = useLanguage()
  const { user: authUser, googleEmail, hasGoogleAuth, hasPasswordAuth, canUnlinkGoogle, unlinkGoogle, linkGoogle, loadAuthMethods } = useAuth()
  const userRole = getUserRole(authUser)
  const roleConfig = ROLE_CONFIG[userRole]
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState(null)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    work: '',
    trade: '',
  })
  const [countryCode, setCountryCode] = useState('+86') // 默认中国

  // 国家代码配置
  const countryCodes = [
    { code: '+86', label: '+86 中国', digits: 11 },
    { code: '+1', label: '+1 美国', digits: 10 },
  ]

  // 获取当前国家代码的位数限制
  const getPhoneDigits = () => {
    const country = countryCodes.find(c => c.code === countryCode)
    return country ? country.digits : 11
  }

  // 解析手机号中的国家代码
  const parsePhoneNumber = (phone) => {
    if (!phone) return { code: '+86', number: '' }
    if (phone.startsWith('+86')) return { code: '+86', number: phone.slice(3) }
    if (phone.startsWith('+1')) return { code: '+1', number: phone.slice(2) }
    // 根据位数猜测
    if (phone.length === 10) return { code: '+1', number: phone }
    return { code: '+86', number: phone }
  }

  // 处理手机号输入（只允许数字）
  const handlePhoneChange = (value) => {
    const digits = value.replace(/\D/g, '') // 只保留数字
    const maxDigits = getPhoneDigits()
    const limited = digits.slice(0, maxDigits) // 限制位数
    setFormData(prev => ({ ...prev, phone: limited }))
  }

  // 加载用户资料
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!authUser?._id) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const result = await getMyDetail()
        if (result.code === 200 && result.data) {
          const { code, number } = parsePhoneNumber(result.data.USER_MOBILE)
          setCountryCode(code)
          setFormData({
            name: result.data.USER_NAME || '',
            phone: number,
            city: result.data.USER_CITY || '',
            work: result.data.USER_WORK || '',
            trade: result.data.USER_TRADE || '',
          })
        }
      } catch (err) {
        console.error('加载用户资料失败:', err)
        // 失败时使用 authUser 的数据
        setFormData({
          name: authUser?.name || '',
          phone: authUser?.phone || '',
          city: '',
          work: '',
          trade: '',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [authUser?._id])

  // 加载认证方式
  useEffect(() => {
    if (authUser?._id && authUser?.role === 'user') {
      loadAuthMethods()
    }
  }, [authUser?._id])

  // 关联 Google 账户（使用弹窗 + ID Token）
  const handleLinkGoogle = () => {
    setIsLinking(true)
    setSaveMessage(null)

    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
      `response_type=token id_token&` +
      `scope=${encodeURIComponent(GOOGLE_SCOPE)}&` +
      `prompt=select_account&` +
      `nonce=${crypto.randomUUID()}`,
      'google-link',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // 监听弹窗消息
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'google-auth') {
        window.removeEventListener('message', handleMessage)
        popup?.close()

        if (event.data.id_token) {
          try {
            const result = await linkGoogle(event.data.id_token)
            if (result.success) {
              // 重新加载认证方式
              loadAuthMethods()
              if (result.merged) {
                setSaveMessage({
                  type: 'success',
                  text: language === 'zh'
                    ? `Google 账户已关联并合并了 ${result.mergeDetails?.cardsTransferred || 0} 张卡片`
                    : `Google account linked and merged ${result.mergeDetails?.cardsTransferred || 0} cards`
                })
              } else {
                setSaveMessage({
                  type: 'success',
                  text: language === 'zh' ? 'Google 账户已关联' : 'Google account linked'
                })
              }
            } else {
              setSaveMessage({
                type: 'error',
                text: result.message || (language === 'zh' ? '关联失败' : 'Failed to link')
              })
            }
          } catch (err) {
            console.error('关联 Google 失败:', err)
            setSaveMessage({
              type: 'error',
              text: language === 'zh' ? '关联失败' : 'Failed to link'
            })
          }
        } else if (event.data.error) {
          setSaveMessage({
            type: 'error',
            text: event.data.error
          })
        }
        setIsLinking(false)
      }
    }
    window.addEventListener('message', handleMessage)

    // 检测弹窗关闭
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        setIsLinking(false)
      }
    }, 1000)
  }

  // 取消关联 Google
  const handleUnlinkGoogle = async () => {
    if (!canUnlinkGoogle) {
      setSaveMessage({
        type: 'error',
        text: language === 'zh' ? '无法取消唯一的登录方式' : 'Cannot unlink your only login method'
      })
      return
    }

    if (!window.confirm(
      language === 'zh'
        ? '确定要取消关联 Google 账户吗？'
        : 'Are you sure you want to unlink your Google account?'
    )) return

    setIsUnlinking(true)
    setSaveMessage(null)

    try {
      const result = await unlinkGoogle()
      if (result.success) {
        setSaveMessage({
          type: 'success',
          text: language === 'zh' ? 'Google 账户已取消关联' : 'Google account unlinked'
        })
      } else {
        setSaveMessage({
          type: 'error',
          text: result.message || (language === 'zh' ? '取消关联失败' : 'Failed to unlink')
        })
      }
    } catch (err) {
      console.error('取消关联失败:', err)
      setSaveMessage({
        type: 'error',
        text: language === 'zh' ? '取消关联失败' : 'Failed to unlink'
      })
    } finally {
      setIsUnlinking(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      setSaveMessage({ type: 'error', text: language === 'zh' ? '请填写姓名' : 'Name is required' })
      return
    }
    if (!formData.phone.trim()) {
      setSaveMessage({ type: 'error', text: language === 'zh' ? '请填写手机号' : 'Phone is required' })
      return
    }

    // 验证手机号位数
    const requiredDigits = getPhoneDigits()
    if (formData.phone.length !== requiredDigits) {
      setSaveMessage({
        type: 'error',
        text: language === 'zh'
          ? `手机号需要 ${requiredDigits} 位数字`
          : `Phone number must be ${requiredDigits} digits`
      })
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      // 发送带国家代码的完整手机号
      const fullPhone = countryCode + formData.phone.trim()
      const result = await editUserBase({
        name: formData.name.trim(),
        mobile: fullPhone,
        city: formData.city.trim(),
        work: formData.work.trim(),
        trade: formData.trade.trim(),
      })

      if (result.code === 200) {
        setSaveMessage({ type: 'success', text: language === 'zh' ? '保存成功' : 'Saved successfully' })
        setIsEditing(false)
        // 3秒后清除消息
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', text: result.msg || (language === 'zh' ? '保存失败' : 'Save failed') })
      }
    } catch (err) {
      console.error('保存用户资料失败:', err)
      setSaveMessage({ type: 'error', text: language === 'zh' ? '保存失败，请重试' : 'Save failed, please try again' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSaveMessage(null)
  }

  const texts = language === 'zh' ? {
    editProfile: '编辑资料',
    save: '保存',
    saving: '保存中...',
    cancel: '取消',
    name: '姓名',
    phone: '手机号码',
    city: '所在城市',
    work: '工作单位',
    trade: '行业领域',
    linkedAccounts: '账户关联',
    linkGoogle: '关联 Google',
    unlinkGoogle: '取消关联',
    googleLinked: '已关联',
    unlinking: '取消中...',
  } : {
    editProfile: 'Edit Profile',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    name: 'Name',
    phone: 'Phone Number',
    city: 'City',
    work: 'Company',
    trade: 'Industry',
    linkedAccounts: 'Linked Accounts',
    linkGoogle: 'Link Google',
    unlinkGoogle: 'Unlink',
    googleLinked: 'Linked',
    unlinking: 'Unlinking...',
  }

  if (isLoading) {
    return (
      <div className="dashboard-content">
        <h1 className="dashboard-title">{t('dashboard.settings')}</h1>
        <p className="dashboard-subtitle">SETTINGS</p>
        <div className="loading-state">
          <Loader2 className="spin" size={32} />
          <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div className="settings-header">
        <div>
          <h1 className="dashboard-title">{t('dashboard.settings')}</h1>
          <p className="dashboard-subtitle">SETTINGS</p>
        </div>
        {!isEditing ? (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            <Edit2 size={18} />
            <span>{texts.editProfile}</span>
          </button>
        ) : (
          <div className="edit-actions">
            <button className="cancel-btn" onClick={handleCancel} disabled={isSaving}>
              {texts.cancel}
            </button>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={18} className="spin" />
                  {texts.saving}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {texts.save}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 保存消息 */}
      {saveMessage && (
        <div className={`save-message ${saveMessage.type}`}>
          {saveMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="settings-list">
        <div className="settings-item">
          <span className="settings-label">{texts.name}</span>
          {isEditing ? (
            <input
              type="text"
              className="settings-input"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={language === 'zh' ? '请输入姓名' : 'Enter name'}
            />
          ) : (
            <span className="settings-value">{formData.name || (language === 'zh' ? '未设置' : 'Not set')}</span>
          )}
        </div>
        <div className="settings-item">
          <span className="settings-label">{texts.phone}</span>
          {isEditing ? (
            <div className="phone-input-group">
              <select
                className="country-code-select"
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value)
                  // 切换国家代码时清空号码
                  setFormData(prev => ({ ...prev, phone: '' }))
                }}
              >
                {countryCodes.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                type="tel"
                className="settings-input phone-number-input"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={`${getPhoneDigits()} ${language === 'zh' ? '位数字' : 'digits'}`}
                maxLength={getPhoneDigits()}
              />
            </div>
          ) : (
            <span className="settings-value">
              {formData.phone ? `${countryCode} ${formData.phone}` : (language === 'zh' ? '未设置' : 'Not set')}
            </span>
          )}
        </div>
        <div className="settings-item">
          <span className="settings-label">{texts.city}</span>
          {isEditing ? (
            <input
              type="text"
              className="settings-input"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder={language === 'zh' ? '请输入城市' : 'Enter city'}
            />
          ) : (
            <span className="settings-value">{formData.city || (language === 'zh' ? '未设置' : 'Not set')}</span>
          )}
        </div>
        <div className="settings-item">
          <span className="settings-label">{texts.work}</span>
          {isEditing ? (
            <input
              type="text"
              className="settings-input"
              value={formData.work}
              onChange={(e) => handleInputChange('work', e.target.value)}
              placeholder={language === 'zh' ? '请输入工作单位' : 'Enter company'}
            />
          ) : (
            <span className="settings-value">{formData.work || (language === 'zh' ? '未设置' : 'Not set')}</span>
          )}
        </div>
        <div className="settings-item">
          <span className="settings-label">{texts.trade}</span>
          {isEditing ? (
            <input
              type="text"
              className="settings-input"
              value={formData.trade}
              onChange={(e) => handleInputChange('trade', e.target.value)}
              placeholder={language === 'zh' ? '请输入行业领域' : 'Enter industry'}
            />
          ) : (
            <span className="settings-value">{formData.trade || (language === 'zh' ? '未设置' : 'Not set')}</span>
          )}
        </div>
        <div className="settings-item">
          <span className="settings-label">{language === 'zh' ? '角色' : 'Role'}</span>
          <span className={`settings-role-badge role-badge--${userRole}`} style={{ color: roleConfig.color }}>
            {roleConfig.icon} {language === 'zh' ? roleConfig.zh : roleConfig.en}
          </span>
        </div>
      </div>

      {/* 账户关联 - 仅对普通用户显示 */}
      {authUser?.role === 'user' && (
        <div className="settings-section linked-accounts">
          <h3 className="section-title">{texts.linkedAccounts}</h3>
          <div className="settings-list">
            <div className="settings-item google-link-item">
              <div className="link-label">
                <GoogleIcon />
                <span>Google</span>
              </div>
              {hasGoogleAuth ? (
                <div className="linked-status">
                  <span className="linked-email" title={googleEmail}>{googleEmail || texts.googleLinked}</span>
                  {canUnlinkGoogle && (
                    <button
                      className="unlink-btn"
                      onClick={handleUnlinkGoogle}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? (
                        <>
                          <Loader2 size={14} className="spin" />
                          <span>{texts.unlinking}</span>
                        </>
                      ) : (
                        <>
                          <Unlink size={14} />
                          <span>{texts.unlinkGoogle}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <button className="link-google-btn" onClick={handleLinkGoogle} disabled={isLinking}>
                  {isLinking ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>{language === 'zh' ? '关联中...' : 'Linking...'}</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={16} />
                      <span>{texts.linkGoogle}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 法律条款 */}
      <div className="settings-section legal-section">
        <h3 className="section-title">{language === 'zh' ? '法律条款' : 'Legal'}</h3>
        <div className="settings-list">
          <a href="#/terms/user" className="settings-item terms-link-item">
            <div className="link-label">
              <FileText size={18} />
              <span>{language === 'zh' ? '用户服务条款' : 'User Terms of Service'}</span>
            </div>
            <ChevronRight size={18} className="chevron-icon" />
          </a>
        </div>
      </div>
    </div>
  )
}

// Sidebar Navigation Item
const NavItem = ({ icon: Icon, label, path, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
)

function Dashboard() {
  const navigate = useNavigate()
  const { t, language, toggleLanguage } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const userRole = getUserRole(user)
  const roleConfig = ROLE_CONFIG[userRole]
  const [currentPath, setCurrentPath] = useState('/dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    if (window.confirm(language === 'zh' ? '确认退出登录？' : 'Confirm logout?')) {
      logout()
      navigate('/login')
    }
  }

  const handleNavigate = (path) => {
    setCurrentPath(path)
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  const navItems = [
    { icon: Activity, label: t('dashboard.overview'), path: '/dashboard' },
    { icon: Calendar, label: t('dashboard.myBookings'), path: '/dashboard/schedule' },
    { icon: CreditCard, label: t('dashboard.myCards'), path: '/dashboard/wallet' },
    { icon: Settings, label: t('dashboard.settings'), path: '/dashboard/settings' },
  ]

  return (
    <div className="dashboard-layout">
      {/* Mobile Header - 只在移动端显示 */}
      <header className="dashboard-mobile-header">
        <button
          type="button"
          className="mobile-home-btn"
          onClick={() => navigate('/')}
        >
          <Home size={20} />
          <span>{language === 'zh' ? '首页' : 'Home'}</span>
        </button>
        <span className="mobile-title">{language === 'zh' ? '个人中心' : 'Dashboard'}</span>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Slide Menu */}
      <aside className={`mobile-slide-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <button
            type="button"
            className="mobile-user-info"
            onClick={() => handleNavigate('/dashboard')}
          >
            <div className="mobile-user-avatar">
              <User size={24} />
            </div>
            <div className="mobile-user-details">
              <span className="mobile-user-greeting">{language === 'zh' ? '欢迎回来' : 'Welcome back'}</span>
              <span className="mobile-user-name" title={user?.name}>{truncateName(user?.name, 10) || (language === 'zh' ? '用户' : 'User')}</span>
            </div>
            <Activity size={18} className="mobile-user-home-icon" />
          </button>
        </div>
        <nav className="mobile-menu-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                type="button"
                key={item.path}
                className={`mobile-menu-item ${currentPath === item.path ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="mobile-menu-controls">
          <button className="sidebar-control-btn" onClick={toggleLanguage}>
            <Globe size={18} />
            <span>{language === 'zh' ? '中文' : 'EN'}</span>
          </button>
          <button className="sidebar-control-btn" onClick={toggleTheme}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="mobile-menu-footer">
          <button
            type="button"
            className="mobile-home-link"
            onClick={() => {
              setIsMobileMenuOpen(false)
              navigate('/')
            }}
          >
            <Home size={18} />
            <span>{t('dashboard.backHome')}</span>
          </button>
          <button
            type="button"
            className="mobile-logout-btn"
            onClick={() => {
              setIsMobileMenuOpen(false)
              handleLogout()
            }}
          >
            <LogOut size={18} />
            <span>{language === 'zh' ? '退出登录' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header" onClick={() => navigate('/')}>
          <Home size={16} />
          <span>{t('dashboard.backHome')}</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={currentPath === item.path}
              onClick={() => handleNavigate(item.path)}
            />
          ))}
        </nav>

        <div className="sidebar-controls">
          <button className="sidebar-control-btn" onClick={toggleLanguage} title={language === 'zh' ? 'Switch to English' : '切换到中文'}>
            <Globe size={16} />
            <span>{language === 'zh' ? '中文' : 'EN'}</span>
          </button>
          <button className="sidebar-control-btn" onClick={toggleTheme} title={isDark ? 'Light Mode' : 'Dark Mode'}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className={`user-badge user-badge--${userRole}`} style={{ borderColor: roleConfig.color, color: roleConfig.color }}>
              <User size={14} />
            </div>
            <span className="user-id" title={user?.name}>{truncateName(user?.name, 8) || 'USER'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
          >
            <LogOut size={16} />
            <span>{language === 'zh' ? '退出登录' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="bg-grid-pattern grid-overlay" />
        <div className="dashboard-container">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="schedule" element={<MySchedule />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
