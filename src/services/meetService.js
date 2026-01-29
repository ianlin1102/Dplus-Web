/**
 * Meet API 服务 - 预约相关接口
 */

import { callCloudRouteHTTP } from './httpApi'

/**
 * 获取指定日期的预约列表
 * @param {string} day - 日期，格式 YYYY-MM-DD
 * @returns {Promise} 预约列表
 */
export const getMeetListByDay = async (day) => {
  try {
    const result = await callCloudRouteHTTP('meet/list_by_day', { day })
    return result
  } catch (error) {
    console.error('获取当日预约列表失败:', error)
    throw error
  }
}

/**
 * 获取一周范围内的预约列表
 * @param {string} startDate - 开始日期，格式 YYYY-MM-DD
 * @param {string} endDate - 结束日期，格式 YYYY-MM-DD
 * @returns {Promise} 预约列表
 */
export const getMeetListByWeek = async (startDate, endDate) => {
  try {
    const result = await callCloudRouteHTTP('meet/list_by_week', { startDate, endDate })
    return result
  } catch (error) {
    console.error('获取周预约列表失败:', error)
    throw error
  }
}

/**
 * 获取从某天开始有预约的日期列表
 * @param {string} day - 起始日期，格式 YYYY-MM-DD
 * @returns {Promise} 有预约的日期数组
 */
export const getMeetHasDays = async (day) => {
  try {
    const result = await callCloudRouteHTTP('meet/list_has_day', { day })
    return result
  } catch (error) {
    console.error('获取有预约日期失败:', error)
    throw error
  }
}

/**
 * 获取预约列表（分页）
 * @param {object} params - 查询参数
 * @returns {Promise} 预约列表
 */
export const getMeetList = async (params = {}) => {
  try {
    const result = await callCloudRouteHTTP('meet/list', {
      page: 1,
      size: 20,
      ...params
    })
    return result
  } catch (error) {
    console.error('获取预约列表失败:', error)
    throw error
  }
}

/**
 * 格式化日期为 YYYY-MM-DD（使用本地时间，避免 toISOString 的 UTC 时区问题）
 * @param {Date} date - 日期对象
 * @returns {string} 格式 YYYY-MM-DD
 */
function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 日期工具函数
 */
export const dateUtils = {
  /**
   * 获取今天的日期字符串（使用本地时间）
   * @returns {string} 格式 YYYY-MM-DD
   */
  getToday() {
    return formatLocalDate(new Date())
  },

  /**
   * 获取本周的起止日期（周一到周日）
   * @param {Date} date - 参考日期，默认今天
   * @returns {{ startDate: string, endDate: string }}
   */
  getWeekRange(date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 调整到周一

    const monday = new Date(d.setDate(diff))
    const sunday = new Date(d.setDate(d.getDate() + 6))

    return {
      startDate: formatLocalDate(monday),
      endDate: formatLocalDate(sunday)
    }
  },

  /**
   * 安全解析日期字符串（避免时区问题）
   * @param {string} dateStr - 日期字符串 YYYY-MM-DD
   * @returns {Date} 本地时间的 Date 对象
   */
  parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  },

  /**
   * 获取上一周的起止日期
   * @param {string} currentStartDate - 当前周的开始日期
   * @returns {{ startDate: string, endDate: string }}
   */
  getPrevWeek(currentStartDate) {
    const d = this.parseLocalDate(currentStartDate)
    d.setDate(d.getDate() - 7)
    return this.getWeekRange(d)
  },

  /**
   * 获取下一周的起止日期
   * @param {string} currentStartDate - 当前周的开始日期
   * @returns {{ startDate: string, endDate: string }}
   */
  getNextWeek(currentStartDate) {
    const d = this.parseLocalDate(currentStartDate)
    d.setDate(d.getDate() + 7)
    return this.getWeekRange(d)
  },

  /**
   * 格式化日期显示
   * @param {string} dateStr - 日期字符串 YYYY-MM-DD
   * @param {string} lang - 语言 'zh' 或 'en'
   * @returns {{ day: number, weekday: string, month: string, fullDate: string }}
   */
  formatDate(dateStr, lang = 'zh') {
    const d = this.parseLocalDate(dateStr)
    const weekdaysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthsZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return {
      day: d.getDate(),
      weekday: lang === 'zh' ? weekdaysZh[d.getDay()] : weekdaysEn[d.getDay()],
      month: lang === 'zh' ? monthsZh[d.getMonth()] : monthsEn[d.getMonth()],
      fullDate: dateStr
    }
  },

  /**
   * 生成一周的日期数组
   * @param {string} startDate - 周一日期
   * @param {string} lang - 语言
   * @returns {Array} 一周7天的日期信息数组
   */
  generateWeekDays(startDate, lang = 'zh') {
    const days = []
    const start = new Date(startDate)

    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      // 使用本地时间格式化，避免 UTC 时区问题
      const dateStr = formatLocalDate(d)
      days.push({
        ...this.formatDate(dateStr, lang),
        isToday: dateStr === this.getToday()
      })
    }

    return days
  }
}

export default {
  getMeetListByDay,
  getMeetListByWeek,
  getMeetHasDays,
  getMeetList,
  dateUtils
}
