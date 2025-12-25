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
 */
export const getDashboardStats = async () => {
  checkAdminAuth()

  try {
    await initDatabase()
    const db = getDatabase()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      totalCards,
      activeCourses,
      todayBookings,
      todayCheckins,
      totalBookings
    ] = await Promise.all([
      // 总用户数
      db.collection('ax_user').count(),

      // 总卡项数（上架）
      db.collection('ax_card_item')
        .where({ CARD_STATUS: 1 })
        .count(),

      // 进行中的课程
      db.collection('ax_meet')
        .where({ MEET_STATUS: 1 })
        .count(),

      // 今日预约
      db.collection('ax_join')
        .where({
          _createTime: db.command.gte(today)
        })
        .count(),

      // 今日签到
      db.collection('ax_join')
        .where({
          JOIN_IS_CHECKIN: 1,
          JOIN_CHECKIN_TIME: db.command.gte(today.getTime())
        })
        .count(),

      // 总预约数
      db.collection('ax_join').count()
    ])

    return {
      success: true,
      data: {
        totalUsers: totalUsers.total || 0,
        totalCards: totalCards.total || 0,
        activeCourses: activeCourses.total || 0,
        todayBookings: todayBookings.total || 0,
        todayCheckins: todayCheckins.total || 0,
        totalBookings: totalBookings.total || 0
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return {
      success: false,
      message: error.message
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
