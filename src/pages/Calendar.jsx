import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import './Calendar.css'

// Service types from smartbeauty
const serviceTypes = {
  zh: [
    { id: 1, name: 'Hip-Hop', color: '#FF6B6B' },
    { id: 2, name: 'K-Pop', color: '#4ECDC4' },
    { id: 3, name: 'Jazz Funk', color: '#FFD93D' },
    { id: 4, name: '古典舞', color: '#A8E6CF' },
  ],
  en: [
    { id: 1, name: 'Hip-Hop', color: '#FF6B6B' },
    { id: 2, name: 'K-Pop', color: '#4ECDC4' },
    { id: 3, name: 'Jazz Funk', color: '#FFD93D' },
    { id: 4, name: 'Classical', color: '#A8E6CF' },
  ],
}

// Demo courses for the schedule
const courses = {
  zh: [
    { id: 1, name: 'Hip-Hop 基础班', duration: '60分钟', instructor: '导师 Jay', time: '10:00', type: 'Hip-Hop', color: '#FF6B6B', spots: 8 },
    { id: 2, name: 'K-Pop 编舞', duration: '90分钟', instructor: '导师 Lisa', time: '14:00', type: 'K-Pop', color: '#4ECDC4', spots: 3 },
    { id: 3, name: 'Jazz Funk 进阶', duration: '90分钟', instructor: '导师 Mike', time: '16:00', type: 'Jazz Funk', color: '#FFD93D', spots: 0 },
    { id: 4, name: '古典舞入门', duration: '60分钟', instructor: '导师 小雅', time: '19:00', type: '古典舞', color: '#A8E6CF', spots: 12 },
  ],
  en: [
    { id: 1, name: 'Hip-Hop Basics', duration: '60 min', instructor: 'Jay', time: '10:00', type: 'Hip-Hop', color: '#FF6B6B', spots: 8 },
    { id: 2, name: 'K-Pop Choreo', duration: '90 min', instructor: 'Lisa', time: '14:00', type: 'K-Pop', color: '#4ECDC4', spots: 3 },
    { id: 3, name: 'Jazz Funk Advanced', duration: '90 min', instructor: 'Mike', time: '16:00', type: 'Jazz Funk', color: '#FFD93D', spots: 0 },
    { id: 4, name: 'Classical Intro', duration: '60 min', instructor: 'Xiaoya', time: '19:00', type: 'Classical', color: '#A8E6CF', spots: 12 },
  ],
}

function Calendar() {
  const { t, language } = useLanguage()
  const [selectedDay, setSelectedDay] = useState(17)
  const [selectedType, setSelectedType] = useState(null)

  // Generate days for the date scroller
  const weekdaysZh = ['日', '一', '二', '三', '四', '五', '六']
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekdays = language === 'zh' ? weekdaysZh : weekdaysEn

  const days = Array.from({ length: 14 }, (_, i) => ({
    day: i + 15,
    weekday: weekdays[(i + 2) % 7]
  }))

  // Filter courses by type
  const filteredCourses = selectedType
    ? courses[language].filter(c => c.type === selectedType)
    : courses[language]

  return (
    <div className="calendar-page">
      <div className="bg-grid-pattern grid-overlay" />

      <div className="calendar-container">
        <h1 className="calendar-title">{t('calendar.title')}</h1>

        {/* Service Type Filter */}
        <div className="type-filter">
          <button
            className={`filter-btn ${!selectedType ? 'active' : ''}`}
            onClick={() => setSelectedType(null)}
          >
            {t('calendar.all')}
          </button>
          {serviceTypes[language].map((type) => (
            <button
              key={type.id}
              className={`filter-btn ${selectedType === type.name ? 'active' : ''}`}
              style={{ '--accent-color': type.color }}
              onClick={() => setSelectedType(type.name)}
            >
              {type.name}
            </button>
          ))}
        </div>

        {/* Date Scroller */}
        <div className="date-scroller scrollbar-hide">
          {days.map(({ day, weekday }) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`date-item ${day === selectedDay ? 'active neon-border-cyan' : ''}`}
            >
              <span className="date-weekday">{language === 'zh' ? `周${weekday}` : weekday}</span>
              <span className="date-day">{day}</span>
              <span className="date-month">{language === 'zh' ? '12月' : 'Dec'}</span>
            </button>
          ))}
        </div>

        {/* Course List */}
        <div className="course-list">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div key={course.id} className="course-card" style={{ '--course-color': course.color }}>
                <div className="course-time">
                  <span className="time-value">{course.time}</span>
                </div>
                <div className="course-info">
                  <div className="course-type-tag" style={{ background: course.color }}>
                    {course.type}
                  </div>
                  <h3 className="course-name">{course.name}</h3>
                  <p className="course-meta">{course.instructor} • {course.duration}</p>
                </div>
                <div className="course-action">
                  <span className={`spots-left ${course.spots === 0 ? 'full' : course.spots <= 3 ? 'limited' : ''}`}>
                    {course.spots === 0 ? t('calendar.full') : `${course.spots} ${t('calendar.spots')} ${t('calendar.spotsLeft')}`}
                  </span>
                  <button className="course-button" disabled={course.spots === 0}>
                    {course.spots === 0 ? t('calendar.full') : t('calendar.book')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>{t('calendar.noClass')}</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="schedule-legend">
          <div className="legend-item">
            <span className="legend-dot available"></span>
            <span>{t('calendar.legendAvailable')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot limited"></span>
            <span>{t('calendar.legendLimited')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot full"></span>
            <span>{t('calendar.legendFull')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar
