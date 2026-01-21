/**
 * 管理员仪表盘
 * 展示核心数据统计、上课排行榜和功能菜单
 * 照搬小程序的功能布局
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  RefreshCw,
  Users,
  CreditCard,
  Calendar,
  CheckSquare,
  BarChart3,
  BookOpen,
  Image,
  UserCog,
  Info,
  Phone,
  QrCode,
  FileText,
  Settings,
  Award,
  Activity,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useLanguage } from '../../../i18n/LanguageContext'
import { getDashboardStats, getRankingList } from '../../../services/adminService'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout, isSuperAdmin } = useAuth()
  const { language } = useLanguage()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCards: 0,
    activeCourses: 0,
    todayBookings: 0,
    todayCheckins: 0,
    activeBookings: 0,
    totalBookings: 0
  })
  const [allRanking, setAllRanking] = useState([])
  const [monthRanking, setMonthRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [statsResult, allRankResult, monthRankResult] = await Promise.all([
        getDashboardStats(),
        getRankingList('all', 10),
        getRankingList('month', 10)
      ])

      if (statsResult.success) {
        setStats(statsResult.data)
      } else {
        throw new Error(statsResult.message)
      }

      if (allRankResult.success) {
        setAllRanking(allRankResult.data)
      }

      if (monthRankResult.success) {
        setMonthRanking(monthRankResult.data)
      }
    } catch (err) {
      console.error('加载数据失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm(language === 'zh' ? '确认退出登录？' : 'Confirm logout?')) {
      logout()
      navigate('/login')
    }
  }

  // 功能菜单配置
  const menuItems = [
    {
      icon: Calendar,
      label: language === 'zh' ? '活动/预约管理' : 'Events/Bookings',
      color: '#3b82f6',
      path: '/admin/meets'
    },
    {
      icon: Users,
      label: language === 'zh' ? '用户管理' : 'Users',
      color: '#22c55e',
      path: '/admin/users'
    },
    {
      icon: BookOpen,
      label: language === 'zh' ? '内容管理' : 'Content',
      color: '#14b8a6',
      path: '/admin/news'
    },
    {
      icon: CreditCard,
      label: language === 'zh' ? '卡项商城管理' : 'Cards',
      color: '#ef4444',
      path: '/admin/cards'
    },
    {
      icon: Award,
      label: language === 'zh' ? '管理用户卡项' : 'User Cards',
      color: '#a855f7',
      path: '/admin/user-cards'
    },
    {
      icon: Image,
      label: language === 'zh' ? '轮播图管理' : 'Carousel',
      color: '#f97316',
      path: '/admin/carousel'
    },
    {
      icon: UserCog,
      label: language === 'zh' ? '导师团队管理' : 'Instructors',
      color: '#ec4899',
      path: '/admin/instructors'
    },
    {
      icon: Info,
      label: language === 'zh' ? '关于我们管理' : 'About Us',
      color: '#78716c',
      path: '/admin/about'
    }
  ]

  // 设置菜单
  const settingsItems = [
    {
      icon: Phone,
      label: language === 'zh' ? '编辑 - 联系我们' : 'Contact Info',
      path: '/admin/contact'
    },
    {
      icon: QrCode,
      label: language === 'zh' ? '小程序二维码' : 'Mini Program QR',
      path: '/admin/qrcode'
    },
    {
      icon: FileText,
      label: language === 'zh' ? '管理员操作日志' : 'Admin Logs',
      path: '/admin/logs'
    },
    {
      icon: Settings,
      label: language === 'zh' ? '系统设置' : 'Settings',
      path: '/admin/settings'
    }
  ]

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            {language === 'zh' ? '重新加载' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(
    ...allRanking.map(item => item.count || 0),
    ...monthRanking.map(item => item.count || 0),
    1
  )

  return (
    <div className="admin-dashboard">
      {/* 管理员信息栏 */}
      <div className="admin-info-bar">
        <div className="admin-avatar">
          <Users size={24} />
        </div>
        <div className="admin-details">
          <h2 className="admin-name">
            {user?.name || 'Admin'}
            <span className={`admin-badge ${isSuperAdmin() ? 'super' : 'normal'}`}>
              {isSuperAdmin()
                ? (language === 'zh' ? '超级管理员' : 'Super Admin')
                : (language === 'zh' ? '管理员' : 'Admin')}
            </span>
          </h2>
          <p className="admin-meta">
            {language === 'zh' ? '欢迎回来' : 'Welcome back'}
          </p>
        </div>
        <div className="admin-actions">
          <button onClick={loadDashboardData} className="action-btn-icon" title="刷新">
            <RefreshCw size={20} />
          </button>
          <button onClick={handleLogout} className="action-btn-icon logout" title="退出">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/admin/meets')}>
          <div className="stat-icon"><Activity size={28} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeCourses}</div>
            <div className="stat-label">{language === 'zh' ? '启用中活动' : 'Active Courses'}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/bookings')}>
          <div className="stat-icon"><Calendar size={28} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeBookings || stats.totalBookings}</div>
            <div className="stat-label">{language === 'zh' ? '有效预约' : 'Active Bookings'}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/users')}>
          <div className="stat-icon"><Users size={28} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">{language === 'zh' ? '用户' : 'Users'}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/news')}>
          <div className="stat-icon"><BookOpen size={28} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCards}</div>
            <div className="stat-label">{language === 'zh' ? '文章数' : 'Articles'}</div>
          </div>
        </div>
      </div>

      {/* 今日数据高亮 */}
      <div className="today-stats">
        <div className="today-stat-card highlight">
          <div className="today-icon"><CheckSquare size={32} /></div>
          <div className="today-content">
            <div className="today-value">{stats.todayCheckins}</div>
            <div className="today-label">{language === 'zh' ? '今日签到' : 'Today Check-ins'}</div>
          </div>
        </div>
        <div className="today-stat-card">
          <div className="today-icon"><Calendar size={32} /></div>
          <div className="today-content">
            <div className="today-value">{stats.todayBookings}</div>
            <div className="today-label">{language === 'zh' ? '今日预约' : 'Today Bookings'}</div>
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="menu-section">
        <h3 className="section-title">{language === 'zh' ? '功能管理' : 'Management'}</h3>
        <div className="menu-grid">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="menu-item"
              onClick={() => navigate(item.path)}
            >
              <div className="menu-icon" style={{ background: `${item.color}20`, color: item.color }}>
                <item.icon size={24} />
              </div>
              <span className="menu-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 设置菜单 */}
      <div className="settings-section">
        <h3 className="section-title">{language === 'zh' ? '系统设置' : 'Settings'}</h3>
        <div className="settings-list">
          {settingsItems.map((item, index) => (
            <div
              key={index}
              className="settings-item"
              onClick={() => navigate(item.path)}
            >
              <item.icon size={20} className="settings-icon" />
              <span className="settings-label">{item.label}</span>
              <ChevronRight size={18} className="settings-arrow" />
            </div>
          ))}
        </div>
      </div>

      {/* 排行榜 */}
      <div className="ranking-section">
        {/* 总榜 */}
        <div className="ranking-card">
          <h2 className="ranking-title">
            <span className="title-icon">🏆</span>
            {language === 'zh' ? '上课总榜' : 'All-Time Ranking'}
          </h2>
          <div className="ranking-list">
            {allRanking.length === 0 ? (
              <div className="empty-ranking">{language === 'zh' ? '暂无数据' : 'No data'}</div>
            ) : (
              allRanking.map((item, index) => (
                <div key={item.userId} className="ranking-item">
                  <div className="rank-number" data-rank={index + 1}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{item.userName}</div>
                  </div>
                  <div className="rank-bar-container">
                    <div
                      className="rank-bar"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg,
                          ${index === 0 ? '#FFD700, #FFA500' :
                            index === 1 ? '#C0C0C0, #A8A8A8' :
                            index === 2 ? '#CD7F32, #8B4513' :
                            '#667eea, #764ba2'})`
                      }}
                    >
                      <span className="count-label">{item.count} {language === 'zh' ? '次' : ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 月榜 */}
        <div className="ranking-card">
          <h2 className="ranking-title">
            <span className="title-icon">📅</span>
            {language === 'zh' ? '本月排行' : 'Monthly Ranking'}
          </h2>
          <div className="ranking-list">
            {monthRanking.length === 0 ? (
              <div className="empty-ranking">{language === 'zh' ? '暂无数据' : 'No data'}</div>
            ) : (
              monthRanking.map((item, index) => (
                <div key={item.userId} className="ranking-item">
                  <div className="rank-number" data-rank={index + 1}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{item.userName}</div>
                  </div>
                  <div className="rank-bar-container">
                    <div
                      className="rank-bar month-bar"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg,
                          ${index === 0 ? '#00f2fe, #4facfe' :
                            index === 1 ? '#f093fb, #f5576c' :
                            index === 2 ? '#fa709a, #fee140' :
                            '#30cfd0, #330867'})`
                      }}
                    >
                      <span className="count-label">{item.count} {language === 'zh' ? '次' : ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 退出登录按钮 */}
      <button onClick={handleLogout} className="logout-btn-full">
        <LogOut size={20} />
        <span>{language === 'zh' ? '退出登录' : 'Logout'}</span>
      </button>
    </div>
  )
}
