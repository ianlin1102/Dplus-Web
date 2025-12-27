import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import './About.css'

// Instructors from smartbeauty
const instructors = {
  zh: [
    { id: 1, name: '导师 Jay', specialty: 'Hip-Hop', desc: '10年街舞教学经验' },
    { id: 2, name: '导师 Lisa', specialty: 'K-Pop', desc: '韩国练习生出身' },
    { id: 3, name: '导师 Mike', specialty: 'Jazz Funk', desc: 'Urban Dance专家' },
    { id: 4, name: '导师 小雅', specialty: '古典舞', desc: '北京舞蹈学院毕业' },
  ],
  en: [
    { id: 1, name: 'Jay', specialty: 'Hip-Hop', desc: '10 years teaching experience' },
    { id: 2, name: 'Lisa', specialty: 'K-Pop', desc: 'Former K-Pop trainee' },
    { id: 3, name: 'Mike', specialty: 'Jazz Funk', desc: 'Urban Dance specialist' },
    { id: 4, name: 'Xiaoya', specialty: 'Classical', desc: 'Beijing Dance Academy graduate' },
  ],
}

function About() {
  const { t, language } = useLanguage()

  return (
    <div className="about-page">
      <div className="bg-grid-pattern grid-overlay" />

      <div className="about-container">
        <header className="about-header">
          <h1 className="about-title">{t('about.title')}</h1>
          <p className="about-subtitle">{t('about.subtitle')}</p>
        </header>

        {/* About Content */}
        <section className="about-section">
          <div className="about-card neon-border-cyan">
            <h2 className="card-title text-cyan">{t('about.storyTitle')}</h2>
            <p className="card-text">{t('about.storyP1')}</p>
            <p className="card-text">{t('about.storyP2')}</p>
          </div>
        </section>

        {/* Instructor Team */}
        <section className="team-section">
          <h2 className="section-title">{t('about.teamTitle')}</h2>
          <div className="team-grid">
            {instructors[language].map((instructor) => (
              <div key={instructor.id} className="team-card">
                <div className="team-avatar neon-border-pink">
                  {instructor.name.charAt(language === 'zh' ? 3 : 0)}
                </div>
                <h3 className="team-name">{instructor.name}</h3>
                <span className="team-specialty text-pink">{instructor.specialty}</span>
                <p className="team-desc">{instructor.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Info */}
        <section className="contact-section">
          <h2 className="section-title">{t('about.contactTitle')}</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <MapPin size={20} className="contact-icon" />
              <div>
                <span className="contact-label">{t('about.address')}</span>
                <p className="contact-value">{language === 'zh' ? 'XX市XX区XX路XX号' : '123 Main St, City'}</p>
              </div>
            </div>
            <div className="contact-item">
              <Phone size={20} className="contact-icon" />
              <div>
                <span className="contact-label">{t('about.phone')}</span>
                <p className="contact-value">400-XXX-XXXX</p>
              </div>
            </div>
            <div className="contact-item">
              <Clock size={20} className="contact-icon" />
              <div>
                <span className="contact-label">{t('about.hours')}</span>
                <p className="contact-value">10:00 - 22:00</p>
              </div>
            </div>
            <div className="contact-item">
              <MessageCircle size={20} className="contact-icon" />
              <div>
                <span className="contact-label">{t('about.wechat')}</span>
                <p className="contact-value">DplusStudio</p>
              </div>
            </div>
          </div>
        </section>

        {/* QR Code Section */}
        <section className="qr-section">
          <h2 className="section-title">{t('about.followUs')}</h2>
          <div className="qr-grid">
            <div className="qr-card neon-border-cyan">
              <div className="qr-placeholder">
                <span>{language === 'zh' ? '客服微信' : 'WeChat'}</span>
              </div>
              <p className="qr-text">{t('about.scanWechat')}</p>
            </div>
            <div className="qr-card neon-border-pink">
              <div className="qr-placeholder">
                <span>{language === 'zh' ? '官方公众号' : 'Official'}</span>
              </div>
              <p className="qr-text">{t('about.scanOfficial')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About
