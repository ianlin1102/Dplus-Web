import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, X, CalendarOff } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { getMeetListByWeek, dateUtils } from '../../services/meetService'
import { getTempDownloadUrl } from '../../utils/cloudUrlHelper'
import CloudImage from '../../components/CloudImage'
import { useTermsCheck } from '../../hooks/useTermsCheck'
import './Calendar.css'

// 类型颜色映射
const typeColors = {
  'Hip-Hop': '#FF6B6B',
  'K-Pop': '#4ECDC4',
  'Jazz Funk': '#FFD93D',
  '古典舞': '#A8E6CF',
  'Classical': '#A8E6CF',
  'default': '#6366f1'
}

// 缓存常量
const CACHE_KEY_WEEK_INDEX = 'calendar_selected_week_index'
const CACHE_KEY_MEETS_PREFIX = 'calendar_meets_'
const CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 5分钟

// 缓存工具函数
const cacheUtils = {
  // 保存周索引到 sessionStorage
  saveWeekIndex(index) {
    try {
      sessionStorage.setItem(CACHE_KEY_WEEK_INDEX, String(index))
    } catch (e) {
      console.warn('保存周索引失败:', e)
    }
  },

  // 从 sessionStorage 获取周索引
  getWeekIndex() {
    try {
      const saved = sessionStorage.getItem(CACHE_KEY_WEEK_INDEX)
      if (saved !== null) {
        const index = parseInt(saved, 10)
        // 验证索引有效性（0-7）
        if (!isNaN(index) && index >= 0 && index <= 7) {
          return index
        }
      }
    } catch (e) {
      console.warn('读取周索引失败:', e)
    }
    return 0 // 默认第一周
  },

  // 保存预约数据到 localStorage（带过期时间）
  saveMeets(startDate, endDate, data) {
    try {
      const cacheKey = `${CACHE_KEY_MEETS_PREFIX}${startDate}_${endDate}`
      const cacheData = {
        data,
        expireTime: Date.now() + CACHE_EXPIRE_TIME
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (e) {
      console.warn('保存预约数据缓存失败:', e)
    }
  },

  // 从 localStorage 获取预约数据（检查过期）
  getMeets(startDate, endDate) {
    try {
      const cacheKey = `${CACHE_KEY_MEETS_PREFIX}${startDate}_${endDate}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data, expireTime } = JSON.parse(cached)
        if (expireTime > Date.now()) {
          return data
        }
        // 已过期，删除缓存
        localStorage.removeItem(cacheKey)
      }
    } catch (e) {
      console.warn('读取预约数据缓存失败:', e)
    }
    return null
  },

  // 清除所有预约数据缓存
  clearMeetsCache() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_MEETS_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('清除预约缓存失败:', e)
    }
  }
}

// 格式化日期为 YYYY-MM-DD（使用本地时间，避免 toISOString 的 UTC 时区问题）
function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

    // 使用本地时间格式化，避免 toISOString 的 UTC 时区问题
    const startDate = formatLocalDate(weekStart)
    const endDate = formatLocalDate(weekEnd)

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

// 安全解析日期字符串（避免时区问题）
// 将 "2026-02-01" 解析为本地时间的该日期，而不是 UTC
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// 获取星期几文字
function getWeekdayLabel(dateStr, language) {
  const date = parseLocalDate(dateStr)
  const dayIndex = date.getDay()
  const weekdaysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return language === 'zh' ? weekdaysZh[dayIndex] : weekdaysEn[dayIndex]
}

// 格式化日期显示
function formatDateLabel(dateStr, language) {
  const date = parseLocalDate(dateStr)
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

// Memoized 单个课程卡片组件
const MeetCard = memo(function MeetCard({ meet, day, language, onMeetClick, typeColors, calculateDuration }) {
  const timeSlot = meet.times?.[0]
  const isFull = timeSlot?.cnt >= timeSlot?.limit
  const accentColor = typeColors[meet.typeName] || typeColors.default

  const handleClick = useCallback(() => {
    if (!isFull) {
      onMeetClick(meet, day)
    }
  }, [meet, day, isFull, onMeetClick])

  return (
    <div
      className={`meet-card ${isFull ? 'full' : 'clickable'}`}
      onClick={handleClick}
      style={{ cursor: isFull ? 'not-allowed' : 'pointer' }}
    >
      <div className="meet-card-accent" style={{ background: accentColor }} />

      <div className="meet-card-time">
        {timeSlot && (
          <>
            <span className="time-range">
              {timeSlot.start} - {timeSlot.end}
            </span>
            <span className="time-duration">
              {timeSlot.duration || calculateDuration(timeSlot.start, timeSlot.end)}
            </span>
          </>
        )}
      </div>

      <div className="meet-card-content">
        <span className="meet-type-tag" style={{ background: accentColor }}>
          {meet.typeName}
        </span>
        <h3 className="meet-title">{meet.title}</h3>
        <p className="meet-instructor">{meet.instructorName}</p>
        {meet.courseInfo && (
          <p className="meet-course-info">{meet.courseInfo}</p>
        )}

        {timeSlot && (
          <div className="meet-spots">
            <span className={`spots-count ${isFull ? 'full' : ''}`}>
              {language === 'zh'
                ? `已约 ${timeSlot.cnt || 0}/${timeSlot.limit} 人`
                : `${timeSlot.cnt || 0}/${timeSlot.limit} booked`}
            </span>
          </div>
        )}
      </div>

      <div className="meet-card-avatar">
        <CloudImage
          src={meet.instructorPic}
          alt={meet.instructorName || ''}
          fallbackText={meet.instructorName || '?'}
        />
      </div>
    </div>
  )
})

// Memoized 日期分组组件
const DayGroup = memo(function DayGroup({ day, meets, language, onMeetClick, typeColors, calculateDuration }) {
  return (
    <div className="day-group">
      <div className="day-header">
        <span className="day-label">{formatDateLabel(day, language)}</span>
      </div>

      {meets.map((meet) => (
        <MeetCard
          key={`${meet._id}-${meet.day}`}
          meet={meet}
          day={day}
          language={language}
          onMeetClick={onMeetClick}
          typeColors={typeColors}
          calculateDuration={calculateDuration}
        />
      ))}
    </div>
  )
})

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
  const navigate = useNavigate()
  const { checkTerms } = useTermsCheck()

  // 周按钮列表
  const [weekButtons] = useState(() => generateWeekButtons(language))
  // 从缓存读取上次选择的周索引
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() => cacheUtils.getWeekIndex())

  // 数据状态
  const [meets, setMeets] = useState([])
  const [loading, setLoading] = useState(true)

  // 月历弹窗状态
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth())

  // 当前选中的周
  const selectedWeek = weekButtons[selectedWeekIndex]

  // 保存周索引到缓存（当切换周时）
  useEffect(() => {
    cacheUtils.saveWeekIndex(selectedWeekIndex)
  }, [selectedWeekIndex])

  // 获取周一所在的周索引
  const findWeekIndexByDate = useCallback((date) => {
    // 使用本地时间格式化，避免 UTC 时区问题
    const targetDate = formatLocalDate(date)
    for (let i = 0; i < weekButtons.length; i++) {
      if (targetDate >= weekButtons[i].startDate && targetDate <= weekButtons[i].endDate) {
        return i
      }
    }
    return 0
  }, [weekButtons])

  // 处理月历日期选择
  const handleDateSelect = useCallback((dayInfo) => {
    if (!dayInfo.day || !dayInfo.isCurrentMonth) return
    const weekIndex = findWeekIndexByDate(dayInfo.date)
    if (selectedWeekIndex !== weekIndex) {
      // 立即清空数据并显示加载状态
      setMeets([])
      setLoading(true)
      setSelectedWeekIndex(weekIndex)
    }
    setShowMonthPicker(false)
  }, [findWeekIndexByDate, selectedWeekIndex])

  // 月份导航
  const goToPrevMonth = useCallback(() => {
    if (pickerMonth === 0) {
      setPickerMonth(11)
      setPickerYear(y => y - 1)
    } else {
      setPickerMonth(m => m - 1)
    }
  }, [pickerMonth])

  const goToNextMonth = useCallback(() => {
    if (pickerMonth === 11) {
      setPickerMonth(0)
      setPickerYear(y => y + 1)
    } else {
      setPickerMonth(m => m + 1)
    }
  }, [pickerMonth])

  // 月历数据 (Memoized)
  const monthDays = useMemo(() => generateMonthCalendar(pickerYear, pickerMonth), [pickerYear, pickerMonth])
  
  const monthNames = useMemo(() => language === 'zh'
    ? ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], [language])
    
  const weekdayNames = useMemo(() => language === 'zh'
    ? ['一', '二', '三', '四', '五', '六', '日']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [language])

  // 加载数据（支持缓存）
  const loadData = useCallback(async () => {
    if (!selectedWeek) return

    // 先检查缓存
    const cachedMeets = cacheUtils.getMeets(selectedWeek.startDate, selectedWeek.endDate)
    if (cachedMeets) {
      console.log('使用缓存的预约数据:', selectedWeek.startDate, '-', selectedWeek.endDate)
      setMeets(cachedMeets)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const weekResult = await getMeetListByWeek(selectedWeek.startDate, selectedWeek.endDate)
      if (weekResult.code === 200 && weekResult.data && weekResult.data.length > 0) {
        // 转换导师图片 URL（cloud:// -> https://）
        const meetsWithPics = await Promise.all(
          weekResult.data.map(async (meet) => {
            if (meet.instructorPic && meet.instructorPic.startsWith('cloud://')) {
              const convertedUrl = await getTempDownloadUrl(meet.instructorPic)
              return { ...meet, instructorPic: convertedUrl }
            }
            return meet
          })
        )
        // 按时间排序
        const sorted = sortMeetsByTime(meetsWithPics)
        setMeets(sorted)
        // 保存到缓存
        cacheUtils.saveMeets(selectedWeek.startDate, selectedWeek.endDate, sorted)
      } else {
        // 无数据时显示空列表
        setMeets([])
        // 空数据也缓存，避免重复请求
        cacheUtils.saveMeets(selectedWeek.startDate, selectedWeek.endDate, [])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      setMeets([])
    } finally {
      setLoading(false)
    }
  }, [selectedWeek]) // 移除 language 依赖，避免语言切换时重新加载

  useEffect(() => {
    loadData()
  }, [loadData])

  // 计算时长 (Memoized helper not strictly needed inside component, but good practice)
  const calculateDuration = useCallback((start, end) => {
    if (!start || !end) return ''
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    if (diff < 60) return `${diff}${language === 'zh' ? '分钟' : 'min'}`
    const h = Math.floor(diff / 60)
    const m = diff % 60
    if (m === 0) return `${h}${language === 'zh' ? '小时' : 'h'}`
    return `${h}${language === 'zh' ? '小时' : 'h'}${m}${language === 'zh' ? '分钟' : 'min'}`
  }, [language])

  // 按日期分组课程 (Memoized)
  const groupedMeets = useMemo(() => {
    // 获取当前时间信息用于过滤
    const now = new Date()
    const todayStr = formatLocalDate(now)
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    return meets.reduce((acc, meet) => {
      // 遍历每个时间段，按 day 分组
      if (meet.times && meet.times.length > 0) {
        meet.times.forEach(timeSlot => {
          const day = timeSlot.day
          if (!day) return

          // 过滤逻辑：
          // 1. 过滤掉今天之前的日期
          if (day < todayStr) return

          // 2. 如果是今天，过滤掉已经开始的时段 (一旦开始即不可预约)
          if (day === todayStr) {
            if (timeSlot.start < currentTimeStr) return
          }

          if (!acc[day]) {
            acc[day] = []
          }

          // 创建一个包含单个时间段的 meet 副本
          acc[day].push({
            ...meet,
            day: day, // 添加 day 属性方便后续使用
            times: [timeSlot] // 只包含当天的时间段
          })
        })
      }
      return acc
    }, {})
  }, [meets])

  // 获取排序后的日期列表 (Memoized)
  const sortedDays = useMemo(() => Object.keys(groupedMeets).sort(), [groupedMeets])

  // 处理课程点击，跳转到预约确认页
  const handleMeetClick = useCallback(async (meet, day) => {
    // 获取时段信息
    const timeSlot = meet.times?.[0]
    if (!timeSlot) return

    // 检查是否已满（云函数返回 cnt 而不是 stat.succCnt）
    if (timeSlot.cnt >= timeSlot.limit) {
      alert(language === 'zh' ? '该时段已满，请选择其他时段' : 'This slot is full, please choose another')
      return
    }

    // 生成 timeMark（使用后端返回的 mark 或生成格式）
    const timeMark = timeSlot.mark || `T${day.replace(/-/g, '')}${Math.random().toString(36).substring(2, 12).toUpperCase()}`

    // 构建返回 URL
    const returnUrl = `/booking/confirm?meetId=${meet._id}&day=${day}&timeMark=${timeMark}&start=${timeSlot.start}&end=${timeSlot.end}`

    // 检查用户条款（自动跳转到条款页面）
    const termsOk = await checkTerms({
      returnUrl,
      redirect: true  // 自动跳转到条款页面
    })

    if (!termsOk) return

    // 跳转到预约确认页，传递完整的 meet 数据
    navigate(returnUrl, {
      state: {
        meet: meet,
        day: day,
        timeSlot: timeSlot
      }
    })
  }, [language, navigate, checkTerms])

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
                onClick={() => {
                  if (selectedWeekIndex !== index) {
                    // 立即清空数据并显示加载状态
                    setMeets([]);
                    setLoading(true);
                    setSelectedWeekIndex(index);
                  }
                }}
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
                  // 使用本地时间格式化，避免 UTC 时区问题
                  const dayDateStr = dayInfo.date ? formatLocalDate(dayInfo.date) : ''
                  const isInRange = dayInfo.date &&
                    dayDateStr >= weekButtons[0].startDate &&
                    dayDateStr <= weekButtons[7].endDate

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
              <DayGroup
                key={day}
                day={day}
                meets={groupedMeets[day]}
                language={language}
                onMeetClick={handleMeetClick}
                typeColors={typeColors}
                calculateDuration={calculateDuration}
              />
            ))
          ) : (
            <div className="empty-state">
              <CalendarOff size={48} className="empty-icon" />
              <p className="empty-title">
                {language === 'zh' ? '该时间段内没有任何可预约的内容' : 'No bookings available for this period'}
              </p>
              <p className="empty-hint">
                {language === 'zh' ? '请选择其他时间或稍后再来查看' : 'Please select another time or check back later'}
              </p>
            </div>
          )}
        </div>

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
