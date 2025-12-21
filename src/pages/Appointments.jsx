import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import './Appointments.css'

// Service types from smartbeauty with their colors
const services = {
  zh: [
    { id: 1, name: 'Hip-Hop', desc: '活力街舞课程', duration: '60分钟', price: 80, color: '#FF6B6B', theme: 'red' },
    { id: 2, name: 'K-Pop', desc: '韩舞编舞课程', duration: '90分钟', price: 100, color: '#4ECDC4', theme: 'cyan' },
    { id: 3, name: 'Jazz Funk', desc: '爵士风格课程', duration: '90分钟', price: 100, color: '#FFD93D', theme: 'yellow' },
    { id: 4, name: '古典舞', desc: '中国古典舞课程', duration: '60分钟', price: 80, color: '#A8E6CF', theme: 'green' },
    { id: 99, name: '私教课程', desc: '一对一定制教学', duration: '按需', price: 200, color: '#d946ef', theme: 'pink' },
  ],
  en: [
    { id: 1, name: 'Hip-Hop', desc: 'High energy street dance', duration: '60 min', price: 80, color: '#FF6B6B', theme: 'red' },
    { id: 2, name: 'K-Pop', desc: 'K-Pop choreography class', duration: '90 min', price: 100, color: '#4ECDC4', theme: 'cyan' },
    { id: 3, name: 'Jazz Funk', desc: 'Jazz style class', duration: '90 min', price: 100, color: '#FFD93D', theme: 'yellow' },
    { id: 4, name: 'Classical', desc: 'Chinese classical dance', duration: '60 min', price: 80, color: '#A8E6CF', theme: 'green' },
    { id: 99, name: 'Private', desc: 'One-on-one custom lesson', duration: 'Flexible', price: 200, color: '#d946ef', theme: 'pink' },
  ],
}

function Appointments() {
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  // Form fields
  const formFields = [
    { name: 'name', label: t('appointments.name'), placeholder: t('appointments.namePlaceholder'), required: true },
    { name: 'phone', label: t('appointments.phone'), placeholder: t('appointments.phonePlaceholder'), required: true },
  ]

  return (
    <div className="appointments-page">
      <div className="bg-grid-pattern grid-overlay" />

      <div className="appointments-container">
        <h1 className="page-title">{t('appointments.title')}</h1>
        <p className="page-subtitle">{t('appointments.subtitle')}</p>

        <div className="services-grid">
          {services[language].map((service) => (
            <div
              key={service.id}
              className="service-card"
              style={{ '--service-color': service.color }}
            >
              <div className="service-header">
                <span className="service-type" style={{ background: service.color }}>
                  {service.name}
                </span>
                <span className="service-duration">{service.duration}</span>
              </div>
              <p className="service-desc">{service.desc}</p>
              <div className="service-footer">
                <span className="service-price" style={{ color: service.color }}>
                  ${service.price}<span className="price-unit">{t('appointments.perClass')}</span>
                </span>
                <button
                  className="service-button"
                  onClick={() => navigate('/calendar')}
                >
                  {t('appointments.selectTime')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Form Preview */}
        <section className="form-section">
          <h2 className="section-title">{t('appointments.formTitle')}</h2>
          <p className="form-note">{t('appointments.formNote')}</p>
          <div className="form-preview">
            {formFields.map((field) => (
              <div key={field.name} className="form-field">
                <label className="field-label">
                  {field.label}
                  {field.required && <span className="required">{t('common.required')}</span>}
                </label>
                <div className="field-input">
                  {field.placeholder}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="cta-banner">
          <div className="cta-content">
            <h2>{t('appointments.ctaTitle')}</h2>
            <p>{t('appointments.ctaDesc')}</p>
          </div>
          <button className="btn-neon cyan" onClick={() => navigate('/store')}>
            {t('appointments.viewCards')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Appointments
