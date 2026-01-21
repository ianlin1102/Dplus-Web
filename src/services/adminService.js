/**
 * 管理员服务层
 * 基于 CloudBase SDK 的混合架构
 * - 简单操作使用 CloudBase SDK 直接访问
 * - 复杂操作预留云函数接口
 */

import {
  initDatabase,
  getDatabase,
  getCurrentAdmin,
  adminLogin as dbAdminLogin,
  adminLogout as dbAdminLogout,
  isAdminLoggedIn as dbIsAdminLoggedIn
} from './databaseService'
import { callCloudRouteHTTP } from './httpApi'

// ==================== 权限控制 ====================

/**
 * 检查管理员权限
 * @throws {Error} 未登录时抛出错误
 */
export const checkAdminAuth = () => {
  if (!dbIsAdminLoggedIn()) {
    throw new Error('请先登录')
  }
  return getCurrentAdmin()
}

// ==================== Admin HTTP API ====================

// 使用与 httpApi.js 相同的云函数地址
const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL ||
  'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

/**
 * 调用 Admin API
 * 部分路由（如 admin/home）已添加到云函数的 publicRoutes，不需要 JWT 认证
 * @param {string} route - API 路由
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} API 响应
 */
export const callAdminAPI = async (route, params = {}) => {
  const admin = getCurrentAdmin()

  // 构建请求头
  const headers = {
    'Content-Type': 'application/json'
  }

  // 如果有 JWT token，添加认证头
  if (admin && admin.token) {
    headers['Authorization'] = `Bearer ${admin.token}`
  }

  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        route,
        PID: 'A00',
        params
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    // 云函数返回格式: { code: 200, data: ... } 或 { code: 500, msg: 'error' }
    if (result.code === 200) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        message: result.msg || '请求失败'
      }
    }
  } catch (error) {
    console.error(`Admin API 调用失败 [${route}]:`, error)
    return {
      success: false,
      message: error.message || '网络错误'
    }
  }
}

/**
 * 检查是否为超级管理员
 */
export const isSuperAdmin = () => {
  const admin = getCurrentAdmin()
  return admin && admin.type === 1
}

// ==================== 认证相关 ====================

/**
 * 管理员登录
 */
export const login = async (username, password) => {
  try {
    await initDatabase()
    const admin = await dbAdminLogin(username, password)
    return {
      success: true,
      data: {
        id: admin._id,
        name: admin.ADMIN_NAME,
        type: admin.ADMIN_TYPE,
        phone: admin.ADMIN_PHONE || ''
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      message: error.message || '登录失败'
    }
  }
}

/**
 * 管理员登出
 */
export const logout = () => {
  dbAdminLogout()
}

/**
 * 检查登录状态
 */
export const isLoggedIn = () => {
  return dbIsAdminLoggedIn()
}

/**
 * 获取当前管理员信息
 */
export const getCurrentAdminInfo = () => {
  return getCurrentAdmin()
}

// ==================== 卡项管理 ====================

/**
 * 获取卡项列表
 */
export const getCardList = async (options = {}) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()
    const { limit = 50, status } = options

    let query = db.collection('ax_card_item')

    if (status !== undefined) {
      query = query.where({ CARD_STATUS: status })
    }

    query = query.orderBy('CARD_ORDER', 'asc').limit(limit)

    const res = await query.get()
    return {
      success: true,
      data: res.data || []
    }
  } catch (error) {
    console.error('获取卡项列表失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 更新卡项信息
 */
export const updateCard = async (cardId, updates) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()

    await db.collection('ax_card_item')
      .doc(cardId)
      .update(updates)

    return {
      success: true,
      message: '更新成功'
    }
  } catch (error) {
    console.error('更新卡项失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 上架/下架卡项
 */
export const toggleCardStatus = async (cardId, status) => {
  checkAdminAuth()

  return await updateCard(cardId, {
    CARD_STATUS: status
  })
}

/**
 * 更新卡项排序
 */
export const updateCardOrder = async (cardId, order) => {
  checkAdminAuth()

  return await updateCard(cardId, {
    CARD_ORDER: order
  })
}

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 */
export const getUserList = async (options = {}) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()
    const { search = '', page = 1, limit = 20 } = options

    let query = db.collection('ax_user')

    if (search) {
      query = query.where({
        USER_NAME: db.RegExp({
          regexp: search,
          options: 'i'
        })
      })
    }

    const skip = (page - 1) * limit

    const [listResult, countResult] = await Promise.all([
      query.orderBy('_createTime', 'desc')
        .skip(skip)
        .limit(limit)
        .get(),
      query.count()
    ])

    return {
      success: true,
      data: {
        list: listResult.data || [],
        total: countResult.total || 0,
        page,
        limit
      }
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 获取用户详情（包含卡项信息）
 */
export const getUserDetail = async (userId) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()

    // 并行查询用户信息和用户卡项
    const [userResult, cardsResult] = await Promise.all([
      db.collection('ax_user').doc(userId).get(),
      db.collection('ax_user_card')
        .where({
          USER_CARD_USER_ID: userId,
          USER_CARD_STATUS: '1'
        })
        .orderBy('USER_CARD_ADD_TIME', 'desc')
        .get()
    ])

    if (!userResult.data || userResult.data.length === 0) {
      throw new Error('用户不存在')
    }

    return {
      success: true,
      data: {
        user: userResult.data[0],
        cards: cardsResult.data || []
      }
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// ==================== 预约管理 ====================

/**
 * 获取预约列表
 */
export const getBookingList = async (options = {}) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()
    const {
      courseId,
      status,
      isCheckedIn,
      search = '',
      date,
      page = 1,
      limit = 50
    } = options

    let whereCondition = {}

    if (courseId) {
      whereCondition.JOIN_MEET_ID = courseId
    }

    if (status !== undefined) {
      whereCondition.JOIN_STATUS = status
    }

    if (isCheckedIn !== undefined) {
      whereCondition.JOIN_IS_CHECKIN = isCheckedIn
    }

    // 日期筛选
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      whereCondition._createTime = db.command.and(
        db.command.gte(startOfDay),
        db.command.lte(endOfDay)
      )
    }

    let query = db.collection('ax_join').where(whereCondition)

    // 搜索用户名
    if (search) {
      query = query.where({
        JOIN_USER_NAME: db.RegExp({
          regexp: search,
          options: 'i'
        })
      })
    }

    const skip = (page - 1) * limit

    const [listResult, countResult] = await Promise.all([
      query.orderBy('_createTime', 'desc')
        .skip(skip)
        .limit(limit)
        .get(),
      query.count()
    ])

    return {
      success: true,
      data: {
        list: listResult.data || [],
        total: countResult.total || 0,
        page,
        limit
      }
    }
  } catch (error) {
    console.error('获取预约列表失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 签到
 */
export const checkin = async (bookingId) => {
  const admin = checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()

    await db.collection('ax_join')
      .doc(bookingId)
      .update({
        JOIN_IS_CHECKIN: 1,
        JOIN_CHECKIN_TIME: Date.now(),
        JOIN_CHECKIN_ADMIN_ID: admin.id
      })

    return {
      success: true,
      message: '签到成功'
    }
  } catch (error) {
    console.error('签到失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 取消签到
 */
export const cancelCheckin = async (bookingId) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()

    await db.collection('ax_join')
      .doc(bookingId)
      .update({
        JOIN_IS_CHECKIN: 0,
        JOIN_CHECKIN_TIME: null,
        JOIN_CHECKIN_ADMIN_ID: null
      })

    return {
      success: true,
      message: '取消签到成功'
    }
  } catch (error) {
    console.error('取消签到失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// ==================== 课程管理 ====================

/**
 * 获取课程列表
 */
export const getCourseList = async (options = {}) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()
    const { status, search = '', page = 1, limit = 20 } = options

    let query = db.collection('ax_meet')

    if (status !== undefined) {
      query = query.where({ MEET_STATUS: status })
    }

    if (search) {
      query = query.where({
        MEET_TITLE: db.RegExp({
          regexp: search,
          options: 'i'
        })
      })
    }

    const skip = (page - 1) * limit

    const [listResult, countResult] = await Promise.all([
      query.orderBy('MEET_ORDER', 'asc')
        .skip(skip)
        .limit(limit)
        .get(),
      query.count()
    ])

    return {
      success: true,
      data: {
        list: listResult.data || [],
        total: countResult.total || 0,
        page,
        limit
      }
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

/**
 * 获取课程详情（包含预约信息）
 */
export const getCourseDetail = async (courseId) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()

    const [courseResult, bookingsResult] = await Promise.all([
      db.collection('ax_meet').doc(courseId).get(),
      db.collection('ax_join')
        .where({ JOIN_MEET_ID: courseId })
        .orderBy('_createTime', 'desc')
        .limit(100)
        .get()
    ])

    if (!courseResult.data || courseResult.data.length === 0) {
      throw new Error('课程不存在')
    }

    const course = courseResult.data[0]
    const bookings = bookingsResult.data || []

    // 统计签到情况
    const checkedInCount = bookings.filter(b => b.JOIN_IS_CHECKIN === 1).length

    return {
      success: true,
      data: {
        course,
        bookings,
        stats: {
          total: bookings.length,
          checkedIn: checkedInCount,
          notCheckedIn: bookings.length - checkedInCount
        }
      }
    }
  } catch (error) {
    console.error('获取课程详情失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// ==================== 统计数据 ====================

/**
 * 获取仪表盘统计数据
 * 使用 HTTP API 调用 admin/home 云函数（已添加到 publicRoutes）
 */
export const getDashboardStats = async () => {
  checkAdminAuth()

  try {
    // 使用 callCloudRouteHTTP 调用 admin/home
    // 该路由已添加到 http_auth.js 的 publicRoutes，无需 JWT 认证
    const result = await callCloudRouteHTTP('admin/home', {})

    // callCloudRouteHTTP 返回格式: { code: 200, data: {...} }
    if (result && result.data) {
      const data = result.data
      return {
        success: true,
        data: {
          totalUsers: data.userCnt || 0,
          totalCards: data.newsCnt || 0,  // 文章数
          activeCourses: data.activeMeetCnt || data.meetCnt || 0,  // 启用中的活动数
          totalCourses: data.meetCnt || 0,  // 活动总数
          todayBookings: data.todayJoinCnt || 0,  // 今日预约数
          todayCheckins: data.todayCheckinCnt || 0,  // 今日签到数
          activeBookings: data.activeJoinCnt || 0,  // 有效预约数
          totalBookings: data.joinCnt || 0  // 预约总数
        }
      }
    } else {
      throw new Error('获取统计数据失败')
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)

    // 降级方案：尝试直接查询数据库（可能因权限问题失败）
    try {
      await initDatabase()
      const db = getDatabase()

      const [totalUsers, activeCourses, totalBookings] = await Promise.all([
        db.collection('ax_user').count(),
        db.collection('ax_meet').where({ MEET_STATUS: 1 }).count(),
        db.collection('ax_join').count()
      ])

      return {
        success: true,
        data: {
          totalUsers: totalUsers.total || 0,
          totalCards: 0,
          activeCourses: activeCourses.total || 0,
          totalCourses: activeCourses.total || 0,
          todayBookings: 0,
          todayCheckins: 0,
          activeBookings: 0,
          totalBookings: totalBookings.total || 0
        }
      }
    } catch (dbError) {
      console.error('降级查询也失败:', dbError)
      return {
        success: false,
        message: error.message
      }
    }
  }
}

/**
 * 获取上课排行榜
 */
export const getRankingList = async (type = 'all', limit = 10) => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()

    let whereCondition = {
      JOIN_IS_CHECKIN: 1
    }

    // 月度排行榜
    if (type === 'month') {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      whereCondition.JOIN_CHECKIN_TIME = db.command.gte(firstDayOfMonth.getTime())
    }

    // 获取所有签到记录
    const result = await db.collection('ax_join')
      .where(whereCondition)
      .get()

    // 统计每个用户的签到次数
    const userStats = {}
    result.data.forEach(item => {
      const userId = item.JOIN_USER_ID
      const userName = item.JOIN_USER_NAME || '未知'

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          userName,
          count: 0
        }
      }
      userStats[userId].count++
    })

    // 转换为数组并排序
    const rankList = Object.values(userStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return {
      success: true,
      data: rankList
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

export default {
  // 认证
  login,
  logout,
  isLoggedIn,
  getCurrentAdminInfo,
  checkAdminAuth,
  isSuperAdmin,

  // Admin API
  callAdminAPI,

  // 卡项
  getCardList,
  updateCard,
  toggleCardStatus,
  updateCardOrder,

  // 用户
  getUserList,
  getUserDetail,

  // 预约
  getBookingList,
  checkin,
  cancelCheckin,

  // 课程
  getCourseList,
  getCourseDetail,

  // 统计
  getDashboardStats,
  getRankingList
}
