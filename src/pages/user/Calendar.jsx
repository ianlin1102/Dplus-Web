import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { getMeetListByWeek, dateUtils } from '../../services/meetService'
import { convertCloudUrl } from '../../utils/cloudUrlHelper'
import './Calendar.css'

// 示例数据（当 API 无数据时使用）
const demoMeets = {
  zh: [
    {
      _id: 'demo1',
      MEET_TITLE: 'Hip-Hop 基础班',
      MEET_INSTRUCTOR_NAME: '导师 Jay',
      MEET_TYPE_NAME: 'Hip-Hop',
      day: '',
      times: [{ start: '10:00', end: '11:30', limit: 20, stat: { succCnt: 5 } }]
    },
    {
      _id: 'demo2',
      MEET_TITLE: 'K-Pop 编舞课',
      MEET_INSTRUCTOR_NAME: '导师 Lisa',
      MEET_TYPE_NAME: 'K-Pop',
      day: '',
      times: [{ start: '14:00', end: '15:30', limit: 15, stat: { succCnt: 12 } }]
    },
    {
      _id: 'demo3',
      MEET_TITLE: 'Jazz Funk 进阶',
      MEET_INSTRUCTOR_NAME: '导师 Mike',
      MEET_TYPE_NAME: 'Jazz Funk',
      day: '',
      times: [{ start: '19:00', end: '20:30', limit: 10, stat: { succCnt: 10 } }]
    }
  ],
  en: [
    {
      _id: 'demo1',
      MEET_TITLE: 'Hip-Hop Basics',
      MEET_INSTRUCTOR_NAME: 'Jay',
      MEET_TYPE_NAME: 'Hip-Hop',
      day: '',
      times: [{ start: '10:00', end: '11:30', limit: 20, stat: { succCnt: 5 } }]
    },
    {
      _id: 'demo2',
      MEET_TITLE: 'K-Pop Choreo',
      MEET_INSTRUCTOR_NAME: 'Lisa',
      MEET_TYPE_NAME: 'K-Pop',
      day: '',
      times: [{ start: '14:00', end: '15:30', limit: 15, stat: { succCnt: 12 } }]
    },
    {
      _id: 'demo3',
      MEET_TITLE: 'Jazz Funk Advanced',
      MEET_INSTRUCTOR_NAME: 'Mike',
      MEET_TYPE_NAME: 'Jazz Funk',
      day: '',
      times: [{ start: '19:00', end: '20:30', limit: 10, stat: { succCnt: 10 } }]
    }
  ]
}

// 类型颜色映射
const typeColors = {
  'Hip-Hop': '#FF6B6B',
  'K-Pop': '#4ECDC4',
  'Jazz Funk': '#FFD93D',
  '古典舞': '#A8E6CF',
  'Classical': '#A8E6CF',
  'default': '#6366f1'
}

// 生成 8 周的周范围列表
function generateWeekButtons(language = 'zh') {
  const weeks = []
  const today = new Date()

  // 获取本周一（周一为一周开始）
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 周日时回退6天，否则回退到周一
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() + i * 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startDate = weekStart.toISOString().split('T')[0]
    const endDate = weekEnd.toISOString().split('T')[0]

    // 格式化显示标签
    const startMonth = weekStart.getMonth() + 1
    const startDay = weekStart.getDate()
    const endMonth = weekEnd.getMonth() + 1
    const endDay = weekEnd.getDate()

    let label
    if (language === 'zh') {
      if (startMonth === endMonth) {
        label = `${startMonth}/${startDay} - ${endDay}`
      } else {
        label = `${startMonth}/${startDay} - ${endMonth}/${endDay}`
      }
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      if (startMonth === endMonth) {
        label = `${months[startMonth - 1]} ${startDay}-${endDay}`
      } else {
        label = `${months[startMonth - 1]} ${startDay} - ${months[endMonth - 1]} ${endDay}`
      }
    }

    weeks.push({
      startDate,
      endDate,
      label,
      isCurrentWeek: i === 0
    })
  }

  return weeks
}

// 按时间排序课程（周日期 + 时间）
function sortMeetsByTime(meets) {
  return [...meets].sort((a, b) => {
    // 先按日期排序
    if (a.day !== b.day) {
      return a.day.localeCompare(b.day)
    }
    // 同一天按时间排序
    const timeA = a.times?.[0]?.start || '00:00'
    const timeB = b.times?.[0]?.start || '00:00'
    return timeA.localeCompare(timeB)
  })
}

// 获取星期几文字
function getWeekdayLabel(dateStr, language) {
  const date = new Date(dateStr)
  const dayIndex = date.getDay()
  const weekdaysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return language === 'zh' ? weekdaysZh[dayIndex] : weekdaysEn[dayIndex]
}

// 格式化日期显示
function formatDateLabel(dateStr, language) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = getWeekdayLabel(dateStr, language)

  if (language === 'zh') {
    return `${month}/${day} ${weekday}`
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${weekday}, ${months[month - 1]} ${day}`
  }
}

// 生成月历数据
function generateMonthCalendar(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0=周日

  // 调整为周一开始
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const days = []

  // 上月填充
  for (let i = 0; i < adjustedStartDay; i++) {
    days.push({ day: null, isCurrentMonth: false })
  }

  // 本月日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    })
  }

  return days
}

function Calendar() {
  const { t, language } = useLanguage()

  // 周按钮列表
  const [weekButtons] = useState(() => generateWeekButtons(language))
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  // 数据状态
  const [meets, setMeets] = useState([])
  const [loading, setLoading] = useState(true)
  const [useDemo, setUseDemo] = useState(false)

  // 月历弹窗状态
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth())

  // 当前选中的周
  const selectedWeek = weekButtons[selectedWeekIndex]

  // 获取周一所在的周索引
  const findWeekIndexByDate = (date) => {
    const targetDate = date.toISOString().split('T')[0]
    for (let i = 0; i < weekButtons.length; i++) {
      if (targetDate >= weekButtons[i].startDate && targetDate <= weekButtons[i].endDate) {
        return i
      }
    }
    return 0
  }

  // 处理月历日期选择
  const handleDateSelect = (dayInfo) => {
    if (!dayInfo.day || !dayInfo.isCurrentMonth) return
    const weekIndex = findWeekIndexByDate(dayInfo.date)
    setSelectedWeekIndex(weekIndex)
    setShowMonthPicker(false)
  }

  // 月份导航
  const goToPrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11)
      setPickerYear(pickerYear - 1)
    } else {
      setPickerMonth(pickerMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0)
      setPickerYear(pickerYear + 1)
    } else {
      setPickerMonth(pickerMonth + 1)
    }
  }

  // 月历数据
  const monthDays = generateMonthCalendar(pickerYear, pickerMonth)
  const monthNames = language === 'zh'
    ? ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const weekdayNames = language === 'zh'
    ? ['一', '二', '三', '四', '五', '六', '日']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // 加载数据
  const loadData = useCallback(async () => {
    if (!selectedWeek) return

    setLoading(true)
    try {
      const weekResult = await getMeetListByWeek(selectedWeek.startDate, selectedWeek.endDate)
      if (weekResult.code === 200 && weekResult.data && weekResult.data.length > 0) {
        // 按时间排序
        const sorted = sortMeetsByTime(weekResult.data)
        setMeets(sorted)
        setUseDemo(false)
      } else {
        // 使用示例数据
        const demos = demoMeets[language].map((m, i) => ({
          ...m,
          day: selectedWeek.startDate // 放在第一天
        }))
        setMeets(demos)
        setUseDemo(true)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      // 使用示例数据
      const demos = demoMeets[language].map((m) => ({
        ...m,
        day: selectedWeek.startDate
      }))
      setMeets(demos)
      setUseDemo(true)
    } finally {
      setLoading(false)
    }
  }, [selectedWeek, language])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 计算时长
  const calculateDuration = (start, end) => {
    if (!start || !end) return ''
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 60) return `${diff}${language === 'zh' ? '分钟' : 'min'}`
    const h = Math.floor(diff / 60)
    const m = diff % 60
    if (m === 0) return `${h}${language === 'zh' ? '小时' : 'h'}`
    return `${h}${language === 'zh' ? '小时' : 'h'}${m}${language === 'zh' ? '分钟' : 'min'}`
  }

  // 按日期分组课程
  const groupedMeets = meets.reduce((acc, meet) => {
    const day = meet.day
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(meet)
    return acc
  }, {})

  // 获取排序后的日期列表
  const sortedDays = Object.keys(groupedMeets).sort()

  return (
    <div className="calendar-page">
      <div className="bg-grid-pattern grid-overlay" />

      <div className="calendar-container">
        <div className="calendar-header">
          <h1 className="calendar-title">{t('calendar.title')}</h1>
          <button
            className="month-picker-btn"
            onClick={() => setShowMonthPicker(true)}
            title={language === 'zh' ? '选择日期' : 'Select Date'}
          >
            <CalendarDays size={24} />
          </button>
        </div>

        {/* 周选择按钮 */}
        <div className="week-buttons-container">
          <div className="week-buttons">
            {weekButtons.map((week, index) => (
              <button
                key={week.startDate}
                className={`week-button ${selectedWeekIndex === index ? 'active' : ''} ${week.isCurrentWeek ? 'current' : ''}`}
                onClick={() => setSelectedWeekIndex(index)}
              >
                {week.label}
              </button>
            ))}
          </div>
        </div>

        {/* 月历弹窗 */}
        {showMonthPicker && (
          <div className="month-picker-overlay" onClick={() => setShowMonthPicker(false)}>
            <div className="month-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="month-picker-header">
                <button className="month-nav-btn" onClick={goToPrevMonth}>
                  <ChevronLeft size={20} />
                </button>
                <span className="month-picker-title">
                  {monthNames[pickerMonth]} {pickerYear}
                </span>
                <button className="month-nav-btn" onClick={goToNextMonth}>
                  <ChevronRight size={20} />
                </button>
                <button className="month-close-btn" onClick={() => setShowMonthPicker(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="month-picker-weekdays">
                {weekdayNames.map((day) => (
                  <span key={day} className="weekday-label">{day}</span>
                ))}
              </div>

              <div className="month-picker-days">
                {monthDays.map((dayInfo, idx) => {
                  const isToday = dayInfo.date &&
                    dayInfo.date.toDateString() === new Date().toDateString()
                  const isInRange = dayInfo.date &&
                    dayInfo.date.toISOString().split('T')[0] >= weekButtons[0].startDate &&
                    dayInfo.date.toISOString().split('T')[0] <= weekButtons[7].endDate

                  return (
                    <button
                      key={idx}
                      className={`month-day ${!dayInfo.day ? 'empty' : ''} ${isToday ? 'today' : ''} ${!isInRange && dayInfo.day ? 'out-of-range' : ''}`}
                      onClick={() => handleDateSelect(dayInfo)}
                      disabled={!dayInfo.day || !isInRange}
                    >
                      {dayInfo.day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 课程列表 */}
        <div className="meet-list">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
            </div>
          ) : meets.length > 0 ? (
            sortedDays.map(day => (
              <div key={day} className="day-group">
                <div className="day-header">
                  <span className="day-label">{formatDateLabel(day, language)}</span>
                </div>

                {groupedMeets[day].map((meet) => (
                  <div key={`${meet._id}-${meet.day}`} className="meet-card">
                    <div
                      className="meet-card-accent"
                      style={{ background: typeColors[meet.MEET_TYPE_NAME] || typeColors.default }}
                    />

                    <div className="meet-card-time">
                      {meet.times && meet.times[0] && (
                        <>
                          <span className="time-range">
                            {meet.times[0].start} - {meet.times[0].end}
                          </span>
                          <span className="time-duration">
                            {calculateDuration(meet.times[0].start, meet.times[0].end)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="meet-card-content">
                      <span
                        className="meet-type-tag"
                        style={{ background: typeColors[meet.MEET_TYPE_NAME] || typeColors.default }}
                      >
                        {meet.MEET_TYPE_NAME}
                      </span>
                      <h3 className="meet-title">{meet.MEET_TITLE}</h3>
                      <p className="meet-instructor">{meet.MEET_INSTRUCTOR_NAME}</p>

                      {meet.times && meet.times[0] && (
                        <div className="meet-spots">
                          <span className={`spots-count ${meet.times[0].stat?.succCnt >= meet.times[0].limit ? 'full' : ''}`}>
                            {language === 'zh'
                              ? `已约 ${meet.times[0].stat?.succCnt || 0}/${meet.times[0].limit} 人`
                              : `${meet.times[0].stat?.succCnt || 0}/${meet.times[0].limit} booked`}
                          </span>
                        </div>
                      )}
                    </div>

                    {meet.MEET_INSTRUCTOR_PIC && (
                      <div className="meet-card-avatar">
                        <img
                          src={convertCloudUrl(meet.MEET_INSTRUCTOR_PIC)}
                          alt={meet.MEET_INSTRUCTOR_NAME}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>{language === 'zh' ? '本周暂无课程安排' : 'No classes scheduled for this week'}</p>
            </div>
          )}
        </div>

        {useDemo && (
          <div className="demo-notice">
            {language === 'zh' ? '当前显示的是示例数据' : 'Showing demo data'}
          </div>
        )}

        {/* 状态说明 */}
        <div className="schedule-legend">
          <div className="legend-item">
            <span className="legend-dot available" />
            <span>{t('calendar.legendAvailable')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot limited" />
            <span>{t('calendar.legendLimited')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot full" />
            <span>{t('calendar.legendFull')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar
