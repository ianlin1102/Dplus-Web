/**
 * 月度课程表打印页面
 * 公开页面，无需登录，可通过浏览器打印保存为 PDF
 * URL: /#/schedule/print 或 /#/schedule/print/2026-02
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './SchedulePrint.css'

const CLOUD_FUNCTION_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

function formatMonthTitle(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function formatDayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
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
    label: formatDayLabel(date),
    classes: dayMap[date].sort((a, b) => (a.start || '').localeCompare(b.start || ''))
  }))
}

export default function SchedulePrint() {
  const { yearMonth: paramYM } = useParams()
  const [yearMonth, setYearMonth] = useState(paramYM || getDefaultYearMonth())
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      // Check localStorage cache (1 hour)
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
        <div className="sched-month-picker">
          <button className="sched-year-btn" onClick={() => switchYear(-1)}>&lsaquo;</button>
          <span className="sched-year-label">{currentYear}</span>
          <button className="sched-year-btn" onClick={() => switchYear(1)}>&rsaquo;</button>
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
        <button onClick={() => window.print()} className="sched-print-btn">
          Print / Save as PDF
        </button>
      </div>

      <div className="sched-content">
        <div className="sched-header">
          <h1 className="sched-studio-name">Dplus Dance Studio</h1>
          <h2 className="sched-title">Monthly Class Schedule</h2>
          <div className="sched-month">{formatMonthTitle(yearMonth)}</div>
        </div>

        {loading && <div className="sched-loading">Loading...</div>}
        {error && <div className="sched-error">{error}</div>}

        {!loading && !error && (
          <div className="sched-body">
            {days.length === 0 && (
              <p className="sched-empty">No classes scheduled this month.</p>
            )}
            {days.map(day => (
              <div key={day.date} className="sched-day-row">
                <div className="sched-day-label">{day.label}</div>
                <div className="sched-classes">
                  {day.classes.map((cls, i) => (
                    <div key={i} className="sched-class-card">
                      <div className="sched-class-time">
                        {cls.start} - {cls.end}
                      </div>
                      <div className="sched-class-title">{cls.title}</div>
                      <div className="sched-class-instructor">
                        {cls.instructorPic && (
                          <img
                            src={cls.instructorPic}
                            alt=""
                            className="sched-instructor-pic"
                            onError={e => { e.target.style.display = 'none' }}
                          />
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
          <p>Schedule is subject to change. Please check the latest information before booking.</p>
        </div>
      </div>
    </div>
  )
}
