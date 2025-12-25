/**
 * 管理员仪表盘
 * 展示核心数据统计和上课排行榜
 */

import { useState, useEffect } from 'react'
import { getDashboardStats, getRankingList } from '../services/adminService'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCards: 0,
    activeCourses: 0,
    todayBookings: 0,
    todayCheckins: 0,
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
      // 并行加载所有数据
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

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // 计算最大签到次数（用于排行榜高度比例）
  const maxCount = Math.max(
    ...allRanking.map(item => item.count),
    ...monthRanking.map(item => item.count),
    1
  )

  return (
    <div className="admin-dashboard">
      {/* 头部 */}
      <div className="dashboard-header">
        <h1>管理后台</h1>
        <button onClick={loadDashboardData} className="refresh-btn">
          刷新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon user-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">总用户数</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon card-icon">🎫</div>
          <div className="stat-content">
            <div className="stat-label">上架卡项</div>
            <div className="stat-value">{stats.totalCards}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon course-icon">📚</div>
          <div className="stat-content">
            <div className="stat-label">进行中课程</div>
            <div className="stat-value">{stats.activeCourses}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon booking-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">今日预约</div>
            <div className="stat-value">{stats.todayBookings}</div>
          </div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon checkin-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">今日签到</div>
            <div className="stat-value">{stats.todayCheckins}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon total-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">累计预约</div>
            <div className="stat-value">{stats.totalBookings}</div>
          </div>
        </div>
      </div>

      {/* 排行榜 */}
      <div className="ranking-section">
        {/* 总榜 */}
        <div className="ranking-card">
          <h2 className="ranking-title">
            <span className="title-icon">🏆</span>
            上课总榜
          </h2>
          <div className="ranking-list">
            {allRanking.length === 0 ? (
              <div className="empty-ranking">暂无数据</div>
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
                      <span className="count-label">{item.count} 次</span>
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
            本月排行
          </h2>
          <div className="ranking-list">
            {monthRanking.length === 0 ? (
              <div className="empty-ranking">暂无数据</div>
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
                      <span className="count-label">{item.count} 次</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="quick-actions">
        <h2>快速操作</h2>
        <div className="action-buttons">
          <a href="#/bookings" className="action-btn">
            📋 查看预约
          </a>
          <a href="#/courses" className="action-btn">
            📚 课程管理
          </a>
          <a href="#/users" className="action-btn">
            👥 用户管理
          </a>
          <a href="#/cards" className="action-btn">
            🎫 卡项管理
          </a>
        </div>
      </div>
    </div>
  )
}
