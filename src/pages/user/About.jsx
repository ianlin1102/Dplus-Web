import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { callCloudRouteHTTP } from '../../services/httpApi'
import './About.css'

function About() {
  const { t, language } = useLanguage()
  const [aboutData, setAboutData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAboutData() {
      try {
        const result = await callCloudRouteHTTP('home/about_data', {})
        if (result && result.data) {
          setAboutData(result.data)
        }
      } catch (err) {
        console.error('Failed to load about data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAboutData()
  }, [])

  if (loading) {
    return (
      <div className="about-page">
        <div className="bg-grid-pattern grid-overlay" />
        <div className="about-container" style={{ textAlign: 'center', paddingTop: '120px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const story = aboutData?.story || {}
  const instructors = aboutData?.instructors || []
  const contact = aboutData?.contact || {}
  const qr = aboutData?.qr || {}
  const storyText = language === 'en' ? (story.en || story.zh) : (story.zh || story.en)
  const hasContact = contact.address || contact.phone || contact.hours || contact.wechat
  const hasQr = qr.servicePic || qr.officePic
  const instructorCount = instructors.length

  return (
    <div className="about-page">
      <div className="bg-grid-pattern grid-overlay" />

      <div className="about-container">
        <header className="about-header">
          <h1 className="about-title">
            {language === 'zh' ? (
              <>
                关于 <br />
                <span className="hero-title-accent">我们</span>
              </>
            ) : (
              <>
                ABOUT <br />
                <span className="hero-title-accent">US</span>
              </>
            )}
          </h1>
          <p className="about-subtitle">{t('about.subtitle')}</p>
        </header>

        {/* Our Story */}
        {storyText && (
          <section className="about-section">
            <div className="about-card">
              <h2 className="card-title text-cyan">{t('about.storyTitle')}</h2>
              <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>{storyText}</p>
            </div>
          </section>
        )}

        {/* Instructor Team */}
        {instructorCount > 0 && (
          <section className="team-section">
            <h2 className="section-title text-pink">{t('about.teamTitle')}</h2>
            <div className="team-grid" data-count={instructorCount}>
              {instructors.map((instructor, idx) => {
                const name = language === 'en' ? (instructor.nameEn || instructor.name) : instructor.name
                const specialty = language === 'en' ? (instructor.specialtyEn || instructor.specialty) : instructor.specialty
                const desc = language === 'en' ? (instructor.descEn || instructor.desc) : instructor.desc
                return (
                  <div key={idx} className="team-card">
                    {instructor.pic ? (
                      <img src={instructor.pic} alt={name} className="team-avatar-img" />
                    ) : (
                      <div className="team-avatar">
                        {name.charAt(0)}
                      </div>
                    )}
                    <h3 className="team-name">{name}</h3>
                    {specialty && <span className="team-specialty text-pink">{specialty}</span>}
                    {desc && <p className="team-desc">{desc}</p>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Contact Info */}
        {hasContact && (
          <section className="contact-section">
            <h2 className="section-title text-cyan">{t('about.contactTitle')}</h2>
            <div className="contact-grid">
              {contact.address && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <span className="contact-label">{t('about.address')}</span>
                    <p className="contact-value">
                      {language === 'en' ? (contact.addressEn || contact.address) : contact.address}
                    </p>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <Phone size={24} />
                  </div>
                  <div>
                    <span className="contact-label">{t('about.phone')}</span>
                    <p className="contact-value">{contact.phone}</p>
                  </div>
                </div>
              )}
              {contact.hours && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <Clock size={24} />
                  </div>
                  <div>
                    <span className="contact-label">{t('about.hours')}</span>
                    <p className="contact-value">
                      {language === 'en' ? (contact.hoursEn || contact.hours) : contact.hours}
                    </p>
                  </div>
                </div>
              )}
              {contact.wechat && (
                <div className="contact-item">
                  <div className="contact-icon">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <span className="contact-label">{t('about.wechat')}</span>
                    <p className="contact-value">{contact.wechat}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* QR Code Section */}
        {hasQr && (
          <section className="qr-section">
            <h2 className="section-title text-pink">{t('about.followUs')}</h2>
            <div className="qr-grid">
              {qr.servicePic && (
                <div className="qr-card">
                  <img src={qr.servicePic} alt="WeChat" className="qr-image" />
                  <p className="qr-text">{t('about.scanWechat')}</p>
                </div>
              )}
              {qr.officePic && (
                <div className="qr-card">
                  <img src={qr.officePic} alt="Official Account" className="qr-image" />
                  <p className="qr-text">{t('about.scanOfficial')}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default About
