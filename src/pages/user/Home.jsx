import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CreditCard, BookOpen, Info } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { getInstructorList } from '../../services/instructorService'
import { convertObjectUrls } from '../../utils/cloudUrlHelper'
import InstructorCarousel from '../../components/InstructorCarousel'
import InstructorModal from '../../components/InstructorModal'
import RankingPodium from '../../components/RankingPodium'
import DataPlaceholder from '../../components/DataPlaceholder'
import { useDataWithRetry } from '../../hooks/useDataWithRetry'
import './Home.css'

// Service types from smartbeauty
const serviceTypes = {
  zh: [
    { id: 1, name: 'Hip-Hop', color: '#FF6B6B', desc: '活力街舞' },
    { id: 2, name: 'K-Pop', color: '#4ECDC4', desc: '韩舞编舞' },
    { id: 3, name: 'Jazz Funk', color: '#FFD93D', desc: '爵士风格' },
    { id: 4, name: '古典舞', color: '#A8E6CF', desc: '传统之美' },
  ],
  en: [
    { id: 1, name: 'Hip-Hop', color: '#FF6B6B', desc: 'Street Dance' },
    { id: 2, name: 'K-Pop', color: '#4ECDC4', desc: 'K-Pop Choreo' },
    { id: 3, name: 'Jazz Funk', color: '#FFD93D', desc: 'Jazz Style' },
    { id: 4, name: 'Classical', color: '#A8E6CF', desc: 'Traditional' },
  ],
}

function Home() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  // 使用自动重试 Hook 加载导师列表
  const {
    data: instructors,
    loading: instructorsLoading,
    error: instructorsError,
    hasData: hasInstructors,
    retryCount: instructorRetryCount
  } = useDataWithRetry(
    async () => {
      const result = await getInstructorList()
      if (result.code === 200 && result.data && result.data.list) {
        // 转换 cloud:// URL 为 HTTPS URL
        return result.data.list.map(instructor =>
          convertObjectUrls(instructor, ['INSTRUCTOR_PIC'])
        )
      }
      return []
    },
    {
      cacheKey: 'instructor_list',
      cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7天
      retryInterval: 60000, // 1分钟
      enableRetry: true
    }
  )

  // 导师弹窗状态
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 处理导师卡片点击 - 打开弹窗
  const handleInstructorClick = (instructor) => {
    setSelectedInstructor(instructor)
    setIsModalOpen(true)
  }

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedInstructor(null)
  }

  const menuItems = [
    { icon: Calendar, label: t('home.menuBook'), path: '/appointments', color: 'cyan' },
    { icon: CreditCard, label: t('home.menuCards'), path: '/store', color: 'pink' },
    { icon: BookOpen, label: t('home.menuCalendar'), path: '/calendar', color: 'green' },
    { icon: Info, label: t('home.menuAbout'), path: '/about', color: 'cyan' },
  ]

  return (
    <div className="home-page">
      {/* Background Grid */}
      <div className="bg-grid-pattern grid-overlay" />

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          {t('home.brandName')} <br />
          <span className="hero-title-accent">STUDIO</span>
        </h1>

        <p className="hero-subtitle">
          {t('home.subtitle')}
        </p>

        <div className="hero-buttons">
          <button
            onClick={() => navigate('/appointments')}
            className="btn-neon cyan neon-border-cyan"
          >
            {language === 'zh' ? '立即预约' : 'Book Now'}
          </button>

          <button
            onClick={() => navigate('/store')}
            className="btn-neon pink neon-border-pink"
          >
            {language === 'zh' ? '查看卡项' : 'View Cards'}
          </button>
        </div>
      </section>

      {/* Quick Menu - matching smartbeauty structure */}
      <section className="menu-section">
        <div className="menu-grid">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.path}
                className={`menu-item neon-border-${item.color}`}
                onClick={() => navigate(item.path)}
              >
                <div className={`menu-icon text-${item.color}`}>
                  <Icon size={32} />
                </div>
                <span className="menu-label">{item.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Service Types Section */}
      <section className="services-section">
        <div className="section-header">
          <h2 className="section-title">{t('home.ourServices')}</h2>
        </div>
        <div className="services-grid">
          {serviceTypes[language].map((service) => (
            <div
              key={service.id}
              className="service-tag"
              style={{ borderColor: service.color, color: service.color }}
            >
              <span className="service-name">{service.name}</span>
              <span className="service-desc">{service.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Ranking Section - Check-in Leaderboard (moved to prominent position) */}
      <section className="ranking-section">
        <div className="section-header">
          <h2 className="section-title">{t('home.rankingTitle', language === 'zh' ? '上课排行榜' : 'Check-in Leaderboard')}</h2>
        </div>
        <RankingPodium limit={10} />
      </section>

      {/* Instructor Section - Horizontal Carousel */}
      <section className="instructor-section">
        <div className="section-header">
          <h2 className="section-title">{t('home.instructorTitle', language === 'zh' ? '导师团队' : 'Instructors')}</h2>
        </div>
        {instructorsLoading || !hasInstructors ? (
          <DataPlaceholder
            type="instructor"
            count={3}
            message={language === 'zh' ? '正在加载导师信息...' : 'Loading instructors...'}
            retryCount={instructorRetryCount}
          />
        ) : (
          <InstructorCarousel
            instructors={instructors}
            onInstructorClick={handleInstructorClick}
          />
        )}
      </section>

      {/* News Section - matching smartbeauty categories */}
      <section className="news-section">
        <div className="section-header">
          <h2 className="section-title">{t('home.newsTitle')}</h2>
        </div>
        <div className="news-grid">
          <div className="news-card neon-border-cyan">
            <span className="news-tag text-cyan">{language === 'zh' ? '公告' : 'News'}</span>
            <h3 className="news-title">{language === 'zh' ? '新课程上线通知' : 'New Class Available'}</h3>
            <p className="news-desc">{language === 'zh' ? 'Jazz Funk 高级班即将开课，欢迎预约体验...' : 'Jazz Funk advanced class coming soon, welcome to book...'}</p>
          </div>
          <div className="news-card neon-border-pink">
            <span className="news-tag text-pink">{language === 'zh' ? '小贴士' : 'Tips'}</span>
            <h3 className="news-title">{language === 'zh' ? '舞蹈前的热身技巧' : 'Warm-up Tips Before Dancing'}</h3>
            <p className="news-desc">{language === 'zh' ? '正确的热身可以有效预防运动损伤...' : 'Proper warm-up can prevent injuries...'}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">{language === 'zh' ? '开启你的舞蹈之旅' : 'Start Your Dance Journey'}</h2>
          <p className="cta-text">{language === 'zh' ? '专业导师团队，沉浸式教学体验' : 'Professional instructors, immersive experience'}</p>
          <button
            onClick={() => navigate('/appointments')}
            className="btn-solid"
          >
            {language === 'zh' ? '立即预约' : 'Book Your Spot'}
          </button>
        </div>
      </section>

      {/* 导师详情弹窗 */}
      <InstructorModal
        instructor={selectedInstructor}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default Home
