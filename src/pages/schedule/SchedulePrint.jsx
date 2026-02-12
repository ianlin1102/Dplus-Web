/**
 * 月度课程表打印页面
 * 公开页面，无需登录，可通过浏览器打印保存为 PDF
 * URL: /#/schedule 或 /#/schedule/2026-02
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './SchedulePrint.css'

const CLOUD_FUNCTION_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const I18N = {
  en: {
    back: 'Back',
    printPdf: 'Print PDF',
    title: 'Monthly Class Schedule',
    loading: 'Synchronizing Schedule Data...',
    retry: 'Retry',
    empty: 'No classes scheduled this month.',
    footer: 'Schedule is subject to change. Please check the latest information before booking.',
    copyright: 'Dplus Dance Studio. All Rights Reserved.',
    instructor: 'Instructor',
  },
  zh: {
    back: '返回',
    printPdf: '打印 PDF',
    title: '月度课程表',
    loading: '正在同步课程数据...',
    retry: '重试',
    empty: '本月暂无课程安排',
    footer: '课程安排可能会有变动，请预约前确认最新信息。',
    copyright: 'Dplus 舞蹈工作室 版权所有',
    instructor: '教师',
  }
}

function getDefaultYearMonth() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function getMonthRange(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}

function formatMonthTitle(yearMonth, lang) {
  const [y, m] = yearMonth.split('-').map(Number)
  if (lang === 'zh') {
    return `${y}年${m}月`
  }
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function formatDayLabel(dateStr, lang) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (lang === 'zh') {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${m}月${d}日 ${weekdays[date.getDay()]}`
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function processScheduleData(meets) {
  const dayMap = {}
  for (const meet of meets) {
    for (const slot of (meet.times || [])) {
      if (!slot.day) continue
      if (!dayMap[slot.day]) dayMap[slot.day] = []
      dayMap[slot.day].push({
        title: meet.title,
        start: slot.start,
        end: slot.end,
        instructorName: meet.instructorName || '',
        instructorPic: meet.instructorPic || '',
      })
    }
  }
  return Object.keys(dayMap).sort().map(date => ({
    date,
    classes: dayMap[date].sort((a, b) => (a.start || '').localeCompare(b.start || ''))
  }))
}

export default function SchedulePrint() {
  const { yearMonth: paramYM } = useParams()
  const navigate = useNavigate()
  const [yearMonth, setYearMonth] = useState(paramYM || getDefaultYearMonth())
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lang, setLang] = useState('en')

  const t = I18N[lang]

  const currentYear = parseInt(yearMonth.split('-')[0])
  const currentMonth = parseInt(yearMonth.split('-')[1])

  function switchMonth(month) {
    const ym = `${currentYear}-${String(month).padStart(2, '0')}`
    setYearMonth(ym)
  }

  function switchYear(delta) {
    const ym = `${currentYear + delta}-${String(currentMonth).padStart(2, '0')}`
    setYearMonth(ym)
  }

  useEffect(() => {
    loadSchedule()
  }, [yearMonth])

  async function loadSchedule() {
    const cacheKey = `sched_print_${yearMonth}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < 3600000) {
          setDays(data)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      setError('')
      const { startDate, endDate } = getMonthRange(yearMonth)

      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'meet/list_by_week',
          PID: 'A00',
          token: '',
          params: { startDate, endDate }
        })
      })

      const result = await response.json()

      if ((result.code === 200 || result.code === 0) && result.data) {
        const processed = processScheduleData(result.data)
        setDays(processed)
        localStorage.setItem(cacheKey, JSON.stringify({ data: processed, ts: Date.now() }))
      } else {
        setError(result.msg || 'Failed to load schedule')
      }
    } catch (err) {
      setError(err.message || 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sched-page">
      <div className="sched-controls no-print">
        <div className="sched-top-bar">
          <button onClick={() => navigate(-1)} className="sched-back-btn">
            &larr; {t.back}
          </button>
          <div className="sched-top-bar-right">
            <button
              className="sched-lang-btn"
              onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            <div className="sched-month-picker">
              <button className="sched-year-btn" onClick={() => switchYear(-1)}>&lsaquo;</button>
              <span className="sched-year-label">{currentYear}</span>
              <button className="sched-year-btn" onClick={() => switchYear(1)}>&rsaquo;</button>
            </div>
            <button onClick={() => window.print()} className="sched-print-btn">
              {t.printPdf}
            </button>
          </div>
        </div>

        <div className="sched-month-tabs">
          {MONTH_LABELS.map((label, i) => (
            <button
              key={label}
              className={`sched-month-tab ${i + 1 === currentMonth ? 'active' : ''}`}
              onClick={() => switchMonth(i + 1)}
            >{label}</button>
          ))}
        </div>
      </div>

      <div className="sched-content">
        <div className="sched-header">
          <h1 className="sched-studio-name">Dplus Dance Studio</h1>
          <h2 className="sched-title">{t.title}</h2>
          <div className="sched-month">{formatMonthTitle(yearMonth, lang)}</div>
        </div>

        {loading && (
          <div className="sched-loading">
            <div className="sched-spinner"></div>
            <span>{t.loading}</span>
          </div>
        )}

        {error && (
          <div className="sched-error">
            <div className="sched-error-icon">!</div>
            <span>{error}</span>
            <button onClick={() => loadSchedule()} className="sched-retry-btn">{t.retry}</button>
          </div>
        )}

        {!loading && !error && (
          <div className="sched-body">
            {days.length === 0 && (
              <p className="sched-empty">{t.empty}</p>
            )}
            {days.map(day => (
              <div key={day.date} className="sched-day-row">
                <div className="sched-day-label">{formatDayLabel(day.date, lang)}</div>
                <div className="sched-classes">
                  {day.classes.map((cls, i) => (
                    <div key={i} className="sched-class-card">
                      <div className="sched-class-time">
                        {cls.start} - {cls.end}
                      </div>
                      <div className="sched-class-title">{cls.title}</div>
                      <div className="sched-class-instructor">
                        {cls.instructorPic ? (
                          <img
                            src={cls.instructorPic}
                            alt=""
                            className="sched-instructor-pic"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="sched-instructor-avatar-mini">
                            {cls.instructorName?.charAt(0) || 'D'}
                          </div>
                        )}
                        <span className="sched-instructor-name">{cls.instructorName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sched-footer">
          <p>{t.footer}</p>
          <p>&copy; {new Date().getFullYear()} {t.copyright}</p>
        </div>
      </div>
    </div>
  )
}
