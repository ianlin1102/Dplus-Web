/**
 * 月度课程表 - 日历视图
 * 以 7x5/6 网格展示月课表，支持打印
 * URL: /schedule/calendar 或 /schedule/calendar/2026-03
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { buildCalendarGrid, exportToExcel } from '../../utils/scheduleExport'
import { useTheme } from '../../App'
import './ScheduleCalendar.css'

const CLOUD_FUNCTION_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 课程色条颜色循环
const CLASS_COLORS = ['#06b6d4', '#d946ef', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899']

const I18N = {
  en: {
    back: 'Back',
    listView: 'List View',
    printPdf: 'Print PDF',
    exportExcel: 'Export Excel',
    title: 'Monthly Class Schedule',
    loading: 'Synchronizing Schedule Data...',
    retry: 'Retry',
    empty: 'No classes scheduled this month.',
    restDay: 'Rest Day',
    footer: 'Schedule is subject to change. Please check the latest information before booking.',
    copyright: 'Dplus Dance Studio. All Rights Reserved.',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  zh: {
    back: '返回',
    listView: '列表视图',
    printPdf: '打印 PDF',
    exportExcel: '导出 Excel',
    title: '月度课程表',
    loading: '正在同步课程数据...',
    retry: '重试',
    empty: '本月暂无课程安排',
    restDay: '休息日',
    footer: '课程安排可能会有变动，请预约前确认最新信息。',
    copyright: 'Dplus 舞蹈工作室 版权所有',
    weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  }
}

function getDefaultYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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
  if (lang === 'zh') return `${y}年${m}月`
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
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
      })
    }
  }
  return Object.keys(dayMap).sort().map(date => ({
    date,
    classes: dayMap[date].sort((a, b) => (a.start || '').localeCompare(b.start || ''))
  }))
}

export default function ScheduleCalendar() {
  const { yearMonth: paramYM } = useParams()
  const navigate = useNavigate()

  const [yearMonth, setYearMonth] = useState(paramYM || getDefaultYearMonth())
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lang, setLang] = useState('en')
  const { isDark, toggleTheme } = useTheme()
  const theme = isDark ? 'dark' : 'light'
  const [selectedCell, setSelectedCell] = useState(null)

  const t = I18N[lang]

  const currentYear = parseInt(yearMonth.split('-')[0])
  const currentMonth = parseInt(yearMonth.split('-')[1])

  const cells = buildCalendarGrid(currentYear, currentMonth, days)
  const weekRows = []
  for (let i = 0; i < cells.length; i += 7) {
    weekRows.push(cells.slice(i, i + 7))
  }

  function switchMonth(month) {
    setYearMonth(`${currentYear}-${String(month).padStart(2, '0')}`)
  }

  function switchYear(delta) {
    setYearMonth(`${currentYear + delta}-${String(currentMonth).padStart(2, '0')}`)
  }

  function goBack() {
    navigate('/calendar')
  }

  const handleExportExcel = async () => {
    await exportToExcel(currentYear, currentMonth, cells, lang)
  }

  function formatCellDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const weekdays = lang === 'zh'
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    if (lang === 'zh') return `${m}月${d}日 ${weekdays[date.getDay()]}`
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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
    <div className={`cal-page ${theme === 'light' ? 'cal-page--light' : ''}`}>
      {/* Controls */}
      <div className="cal-controls no-print">
        <div className="cal-top-bar">
          <button onClick={goBack} className="cal-btn cal-back-btn">&larr; {t.back}</button>
          <div className="cal-top-bar-right">
            <button
              className="cal-btn cal-theme-btn"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
            <button
              className="cal-btn cal-lang-btn"
              onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>
            <div className="cal-year-picker">
              <button className="cal-year-btn" onClick={() => switchYear(-1)}>&lsaquo;</button>
              <span className="cal-year-label">{currentYear}</span>
              <button className="cal-year-btn" onClick={() => switchYear(1)}>&rsaquo;</button>
            </div>
            <Link to={`/schedule/${yearMonth}`} className="cal-btn cal-list-link">
              {t.listView}
            </Link>
            <button onClick={handleExportExcel} className="cal-btn cal-excel-btn" disabled={loading || days.length === 0}>
              {t.exportExcel}
            </button>
            <button onClick={() => window.print()} className="cal-btn cal-print-btn">
              {t.printPdf}
            </button>
          </div>
        </div>

        <div className="cal-month-tabs">
          {MONTH_LABELS.map((label, i) => (
            <button
              key={label}
              className={`cal-month-tab ${i + 1 === currentMonth ? 'active' : ''}`}
              onClick={() => switchMonth(i + 1)}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Printable Content */}
      <div className="cal-content">
        <div className="cal-header">
          <h1 className="cal-studio-name">Dplus Dance Studio</h1>
          <h2 className="cal-title">{t.title}</h2>
          <div className="cal-month-label">{formatMonthTitle(yearMonth, lang)}</div>
        </div>

        {loading && (
          <div className="cal-loading">
            <div className="cal-spinner"></div>
            <span>{t.loading}</span>
          </div>
        )}

        {error && (
          <div className="cal-error">
            <span>{error}</span>
            <button onClick={loadSchedule} className="cal-btn">{t.retry}</button>
          </div>
        )}

        {!loading && !error && (
          <div className="cal-grid-scroll">
            <div className="cal-grid-wrapper">
              {/* Weekday headers */}
              <div className="cal-grid cal-grid-header">
                {t.weekdays.map(d => (
                  <div key={d} className="cal-weekday">{d}</div>
                ))}
              </div>

              {/* Calendar rows */}
              {weekRows.map((row, rowIdx) => (
                <div key={rowIdx} className="cal-grid cal-grid-row">
                  {row.map((cell, colIdx) => {
                    const hasClasses = cell.classes.length > 0
                    const isRest = cell.isCurrentMonth && !hasClasses

                    return (
                      <div
                        key={cell.date}
                        className={[
                          'cal-cell',
                          !cell.isCurrentMonth && 'cal-cell--outside',
                          hasClasses && 'cal-cell--has-classes',
                          isRest && 'cal-cell--rest',
                        ].filter(Boolean).join(' ')}
                        onClick={() => cell.isCurrentMonth && setSelectedCell(cell)}
                      >
                        <div className="cal-cell-day">{cell.isCurrentMonth ? cell.day : ''}</div>

                        {hasClasses && (
                          <div className="cal-cell-classes">
                            {cell.classes.map((cls, i) => (
                              <div
                                key={i}
                                className="cal-class-item"
                                style={{ borderLeftColor: CLASS_COLORS[i % CLASS_COLORS.length] }}
                              >
                                <span className="cal-class-time">{cls.start}</span>
                                <span className="cal-class-title">{cls.title}</span>
                                <span className="cal-class-instructor">{cls.instructorName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isRest && (
                          <div className="cal-cell-rest">
                            <span className="cal-rest-dot">&#10022;</span>
                            <span className="cal-rest-text">{t.restDay}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day detail modal */}
        {selectedCell && (
          <div className="cal-modal-overlay" onClick={() => setSelectedCell(null)}>
            <div className="cal-modal" onClick={e => e.stopPropagation()}>
              <div className="cal-modal-header">
                <div className="cal-modal-date">{formatCellDate(selectedCell.date)}</div>
                <button className="cal-modal-close" onClick={() => setSelectedCell(null)}>&times;</button>
              </div>
              <div className="cal-modal-body">
                {selectedCell.classes.length === 0 ? (
                  <div className="cal-modal-rest">{t.restDay}</div>
                ) : (
                  selectedCell.classes.map((cls, i) => (
                    <div key={i} className="cal-modal-class" style={{ borderLeftColor: CLASS_COLORS[i % CLASS_COLORS.length] }}>
                      <div className="cal-modal-class-time">{cls.start} - {cls.end}</div>
                      <div className="cal-modal-class-title">{cls.title}</div>
                      {cls.instructorName && (
                        <div className="cal-modal-class-instructor">{cls.instructorName}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="cal-footer">
          <p>{t.footer}</p>
          <p>&copy; {new Date().getFullYear()} {t.copyright}</p>
        </div>
      </div>
    </div>
  )
}
