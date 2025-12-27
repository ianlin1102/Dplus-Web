import { useState } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import { Home, Calendar, CreditCard, Settings, Activity, User } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import './Dashboard.css'

// Mock user data from smartbeauty structure
const userData = {
  zh: {
    name: '用户',
    phone: '138****8888',
    level: 'VIP会员',
    points: 1200,
    cards: { totalTimes: 15, totalBalance: 580 },
    activities: [
      { date: '今天', event: 'Hip-Hop 基础班', status: '已签到', type: 'checkin' },
      { date: '12月15日', event: '购买次数卡', status: '已完成', type: 'purchase' },
      { date: '12月12日', event: 'K-Pop 编舞课', status: '已预约', type: 'booking' },
      { date: '12月10日', event: '私教课程', status: '已取消', type: 'cancelled' },
    ],
  },
  en: {
    name: 'User',
    phone: '138****8888',
    level: 'VIP Member',
    points: 1200,
    cards: { totalTimes: 15, totalBalance: 580 },
    activities: [
      { date: 'Today', event: 'Hip-Hop Basics', status: 'Checked In', type: 'checkin' },
      { date: 'Dec 15', event: 'Bought Class Pack', status: 'Completed', type: 'purchase' },
      { date: 'Dec 12', event: 'K-Pop Choreo', status: 'Booked', type: 'booking' },
      { date: 'Dec 10', event: 'Private Lesson', status: 'Cancelled', type: 'cancelled' },
    ],
  },
}

// Dashboard Overview Component
const DashboardOverview = () => {
  const { t, language } = useLanguage()
  const user = userData[language]

  return (
    <div className="dashboard-content">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{t('dashboard.title')}</h1>
          <p className="dashboard-subtitle">{t('dashboard.welcome')}, {user.name}</p>
        </div>
        <div className="header-date">
          <span className="date-text">{new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</span>
        </div>
      </header>

      {/* Member Level Card */}
      <div className="level-card neon-border-cyan">
        <div className="level-header">
          <div>
            <span className="level-label">{t('dashboard.memberLevel')}</span>
            <h3 className="level-name">{user.level}</h3>
          </div>
          <span className="level-xp">{user.points} {t('dashboard.points')}</span>
        </div>
        <div className="level-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }}></div>
          </div>
        </div>
        <p className="level-hint">{t('dashboard.upgradeHint')}</p>
      </div>

      {/* 卡项汇总 Stats Grid */}
      <div className="stats-section">
        <h3 className="stats-title">{t('dashboard.cardSummary')}</h3>
        <div className="stats-grid">
          <div className="stat-card neon-border-cyan">
            <span className="stat-label">{t('dashboard.totalTimes')}</span>
            <span className="stat-value text-cyan">{user.cards.totalTimes}</span>
            <span className="stat-unit">{language === 'zh' ? '次' : 'classes'}</span>
          </div>
          <div className="stat-card neon-border-pink">
            <span className="stat-label">{t('dashboard.totalBalance')}</span>
            <span className="stat-value text-pink">¥{user.cards.totalBalance}</span>
            <span className="stat-unit">{language === 'zh' ? '元' : 'CNY'}</span>
          </div>
          <div className="stat-card neon-border-green">
            <span className="stat-label">{t('dashboard.points')}</span>
            <span className="stat-value text-green">{user.points}</span>
            <span className="stat-unit">{language === 'zh' ? '分' : 'pts'}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-card">
        <h3 className="activity-title">{t('dashboard.recentActivity')}</h3>
        <div className="activity-list">
          {user.activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <span className="activity-date">{activity.date}</span>
              <span className="activity-event">{activity.event}</span>
              <span className={`activity-status ${
                activity.type === 'checkin' ? 'status-cyan' :
                activity.type === 'purchase' ? 'status-pink' :
                activity.type === 'booking' ? 'status-green' :
                'status-muted'
              }`}>{activity.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// My bookings data
const myBookings = {
  zh: [
    { id: 1, name: 'Hip-Hop 基础班', date: '12月18日', time: '14:00', instructor: 'Jay', status: 'confirmed' },
    { id: 2, name: 'K-Pop 编舞课', date: '12月20日', time: '16:00', instructor: 'Lisa', status: 'confirmed' },
    { id: 3, name: '私教课程', date: '12月22日', time: '10:00', instructor: 'Mike', status: 'pending' },
  ],
  en: [
    { id: 1, name: 'Hip-Hop Basics', date: 'Dec 18', time: '14:00', instructor: 'Jay', status: 'confirmed' },
    { id: 2, name: 'K-Pop Choreo', date: 'Dec 20', time: '16:00', instructor: 'Lisa', status: 'confirmed' },
    { id: 3, name: 'Private Lesson', date: 'Dec 22', time: '10:00', instructor: 'Mike', status: 'pending' },
  ],
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

// Sub-page components
const MySchedule = () => {
  const { t, language } = useLanguage()
  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">{t('dashboard.myBookings')}</h1>
      <p className="dashboard-subtitle">MY BOOKINGS</p>

      <div className="bookings-list">
        {myBookings[language].map((booking) => (
          <div key={booking.id} className="booking-card">
            <div className="booking-info">
              <h3 className="booking-name">{booking.name}</h3>
              <p className="booking-meta">{booking.date} {booking.time} · {booking.instructor}</p>
            </div>
            <span className={`booking-status ${booking.status}`}>
              {booking.status === 'confirmed' ? t('dashboard.confirmed') : t('dashboard.pending')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const Wallet = () => {
  const { t, language } = useLanguage()
  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">{t('dashboard.myCards')}</h1>
      <p className="dashboard-subtitle">MY CARDS</p>

      <div className="cards-list">
        {myCards[language].map((card) => (
          <div key={card.id} className="wallet-card" style={{ '--card-color': card.color }}>
            <div className="wallet-card-header">
              <span className="card-type-tag" style={{ background: card.color }}>{card.type}</span>
              <span className="card-expiry">{t('dashboard.validUntil')} {card.expiry}</span>
            </div>
            <h3 className="wallet-card-name">{card.name}</h3>
            <div className="wallet-card-balance">
              <span className="balance-value" style={{ color: card.color }}>
                {card.type === '余额卡' || card.type === 'Credit Card' ? `¥${card.remaining}` : card.remaining}
              </span>
              <span className="balance-total">
                / {card.type === '余额卡' || card.type === 'Credit Card' ? `¥${card.total}` : `${card.total} ${language === 'zh' ? '次' : 'classes'}`}
              </span>
            </div>
            <div className="wallet-progress">
              <div
                className="wallet-progress-fill"
                style={{
                  width: `${(card.remaining / card.total) * 100}%`,
                  background: card.color
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SettingsPage = () => {
  const { t, language } = useLanguage()
  const user = userData[language]
  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">{t('dashboard.settings')}</h1>
      <p className="dashboard-subtitle">SETTINGS</p>

      <div className="settings-list">
        <div className="settings-item">
          <span className="settings-label">{t('dashboard.phoneNumber')}</span>
          <span className="settings-value">{user.phone}</span>
        </div>
        <div className="settings-item">
          <span className="settings-label">{t('dashboard.memberLevel')}</span>
          <span className="settings-value">{user.level}</span>
        </div>
        <div className="settings-item">
          <span className="settings-label">{t('dashboard.accumulatedPoints')}</span>
          <span className="settings-value">{user.points} {language === 'zh' ? '分' : 'pts'}</span>
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
  const { t, language } = useLanguage()
  const [currentPath, setCurrentPath] = useState('/dashboard')

  const handleNavigate = (path) => {
    setCurrentPath(path)
    navigate(path)
  }

  const navItems = [
    { icon: Activity, label: t('dashboard.overview'), path: '/dashboard' },
    { icon: Calendar, label: t('dashboard.myBookings'), path: '/dashboard/schedule' },
    { icon: CreditCard, label: t('dashboard.myCards'), path: '/dashboard/wallet' },
    { icon: Settings, label: t('dashboard.settings'), path: '/dashboard/settings' },
  ]

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
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

        <div className="sidebar-footer">
          <div className="user-badge neon-border-cyan">
            <User size={14} />
          </div>
          <span className="user-id">USER.ID</span>
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
