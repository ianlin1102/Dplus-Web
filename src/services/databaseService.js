/**
 * 数据库服务层
 * 基于 CloudBase SDK 直接访问数据库
 */

import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'cloud1-6gnd02he13c1ff2e'
const PROJECT_ID = 'A00'

// 初始化 CloudBase
let app = null
let db = null
let auth = null

/**
 * 初始化数据库连接
 */
export const initDatabase = async () => {
  if (app) return app

  try {
    app = cloudbase.init({
      env: ENV_ID
    })

    auth = app.auth({ persistence: 'local' })
    db = app.database()

    // 检查登录状态
    const loginState = await auth.getLoginState()

    if (!loginState) {
      // 匿名登录
      await auth.anonymousAuthProvider().signIn()
      console.log('✅ CloudBase 匿名登录成功')
    }

    console.log('✅ CloudBase 数据库初始化成功')
    return app
  } catch (error) {
    console.error('❌ CloudBase 初始化失败:', error)
    throw error
  }
}

/**
 * 获取数据库实例
 */
export const getDatabase = () => {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()')
  }
  return db
}

/**
 * 获取 Auth 实例
 */
export const getAuth = () => {
  if (!auth) {
    throw new Error('Auth 未初始化，请先调用 initDatabase()')
  }
  return auth
}

// ==================== 管理员相关 ====================

/**
 * 管理员登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 管理员信息
 */
export const adminLogin = async (username, password) => {
  const db = getDatabase()

  const result = await db.collection('ax_admin')
    .where({
      _pid: PROJECT_ID,
      ADMIN_NAME: username,
      ADMIN_PASSWORD: password,
      ADMIN_STATUS: 1  // 启用状态
    })
    .get()

  if (result.data && result.data.length > 0) {
    const admin = result.data[0]
    // 保存登录信息到本地
    localStorage.setItem('admin_info', JSON.stringify({
      id: admin._id,
      name: admin.ADMIN_NAME,
      type: admin.ADMIN_TYPE
    }))
    return admin
  } else {
    throw new Error('用户名或密码错误')
  }
}

/**
 * 检查管理员登录状态
 */
export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('admin_info')
}

/**
 * 获取当前管理员信息
 */
export const getCurrentAdmin = () => {
  const adminInfo = localStorage.getItem('admin_info')
  return adminInfo ? JSON.parse(adminInfo) : null
}

/**
 * 管理员登出
 */
export const adminLogout = () => {
  localStorage.removeItem('admin_info')
}

// ==================== 课程管理 ====================

/**
 * 获取课程列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 课程列表
 */
export const getCourseList = async (options = {}) => {
  const db = getDatabase()
  const {
    status = null,  // 课程状态 (1=进行中, 0=未启用, 9=已停止)
    search = '',    // 搜索关键词
    page = 1,
    limit = 10
  } = options

  let query = db.collection('ax_meet')
    .where({ _pid: PROJECT_ID })

  // 状态筛选
  if (status !== null) {
    query = query.where({ MEET_STATUS: status })
  }

  // 搜索
  if (search) {
    query = query.where({
      MEET_TITLE: db.RegExp({
        regexp: search,
        options: 'i'
      })
    })
  }

  // 分页
  const skip = (page - 1) * limit

  const [listResult, countResult] = await Promise.all([
    query.orderBy('MEET_ORDER', 'asc')
      .skip(skip)
      .limit(limit)
      .get(),
    query.count()
  ])

  return {
    list: listResult.data || [],
    total: countResult.total || 0,
    page,
    limit
  }
}

/**
 * 获取课程详情
 * @param {string} courseId - 课程 ID
 * @returns {Promise<Object>} 课程详情
 */
export const getCourseDetail = async (courseId) => {
  const db = getDatabase()

  const result = await db.collection('ax_meet')
    .doc(courseId)
    .get()

  if (result.data && result.data.length > 0) {
    return result.data[0]
  } else {
    throw new Error('课程不存在')
  }
}

/**
 * 创建课程
 * @param {Object} courseData - 课程数据
 * @returns {Promise<string>} 课程 ID
 */
export const createCourse = async (courseData) => {
  const db = getDatabase()

  const result = await db.collection('ax_meet').add({
    data: {
      _pid: PROJECT_ID,
      MEET_TITLE: courseData.title,
      MEET_CONTENT: courseData.content || '',
      MEET_STATUS: courseData.status || 1,
      MEET_MAX_CNT: courseData.maxCount || 20,
      MEET_ORDER: courseData.order || 9999,
      MEET_OBJ: courseData.obj || {},
      _createTime: new Date(),
      _updateTime: new Date()
    }
  })

  return result.id
}

/**
 * 更新课程
 * @param {string} courseId - 课程 ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<void>}
 */
export const updateCourse = async (courseId, updates) => {
  const db = getDatabase()

  await db.collection('ax_meet')
    .doc(courseId)
    .update({
      data: {
        ...updates,
        _updateTime: new Date()
      }
    })
}

/**
 * 删除课程
 * @param {string} courseId - 课程 ID
 * @returns {Promise<void>}
 */
export const deleteCourse = async (courseId) => {
  const db = getDatabase()

  await db.collection('ax_meet')
    .doc(courseId)
    .remove()
}

// ==================== 预约管理 ====================

/**
 * 获取预约列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 预约列表
 */
export const getBookingList = async (options = {}) => {
  const db = getDatabase()
  const {
    courseId = null,
    status = null,      // 预约状态
    isCheckedIn = null, // 是否已签到
    search = '',
    page = 1,
    limit = 30
  } = options

  let whereCondition = { _pid: PROJECT_ID }

  if (courseId) {
    whereCondition.JOIN_MEET_ID = courseId
  }

  if (status !== null) {
    whereCondition.JOIN_STATUS = status
  }

  if (isCheckedIn !== null) {
    whereCondition.JOIN_IS_CHECKIN = isCheckedIn
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
    list: listResult.data || [],
    total: countResult.total || 0,
    page,
    limit
  }
}

/**
 * 签到
 * @param {string} bookingId - 预约 ID
 * @returns {Promise<void>}
 */
export const checkinBooking = async (bookingId) => {
  const db = getDatabase()

  await db.collection('ax_join')
    .doc(bookingId)
    .update({
      data: {
        JOIN_IS_CHECKIN: 1,
        JOIN_CHECKIN_TIME: new Date(),
        _updateTime: new Date()
      }
    })
}

/**
 * 取消签到
 * @param {string} bookingId - 预约 ID
 * @returns {Promise<void>}
 */
export const cancelCheckin = async (bookingId) => {
  const db = getDatabase()

  await db.collection('ax_join')
    .doc(bookingId)
    .update({
      data: {
        JOIN_IS_CHECKIN: 0,
        JOIN_CHECKIN_TIME: null,
        _updateTime: new Date()
      }
    })
}

// ==================== 学员管理 ====================

/**
 * 获取学员列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 学员列表
 */
export const getStudentList = async (options = {}) => {
  const db = getDatabase()
  const {
    search = '',
    page = 1,
    limit = 20
  } = options

  let query = db.collection('ax_user')
    .where({ _pid: PROJECT_ID })

  // 搜索
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
    list: listResult.data || [],
    total: countResult.total || 0,
    page,
    limit
  }
}

/**
 * 获取学员详情
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 学员详情
 */
export const getStudentDetail = async (userId) => {
  const db = getDatabase()

  const result = await db.collection('ax_user')
    .doc(userId)
    .get()

  if (result.data && result.data.length > 0) {
    return result.data[0]
  } else {
    throw new Error('学员不存在')
  }
}

// ==================== 数据统计 ====================

/**
 * 获取统计数据
 * @returns {Promise<Object>} 统计数据
 */
export const getStatistics = async () => {
  const db = getDatabase()

  // 并行查询多个统计数据
  const [
    totalStudents,
    activeCourses,
    totalBookings,
    todayCheckins
  ] = await Promise.all([
    // 总学员数
    db.collection('ax_user')
      .where({ _pid: PROJECT_ID })
      .count(),

    // 进行中的课程
    db.collection('ax_meet')
      .where({ _pid: PROJECT_ID, MEET_STATUS: 1 })
      .count(),

    // 总预约数
    db.collection('ax_join')
      .where({ _pid: PROJECT_ID })
      .count(),

    // 今日签到数
    db.collection('ax_join')
      .where({
        _pid: PROJECT_ID,
        JOIN_IS_CHECKIN: 1,
        JOIN_CHECKIN_TIME: db.command.gte(new Date(new Date().setHours(0, 0, 0, 0)))
      })
      .count()
  ])

  return {
    totalStudents: totalStudents.total || 0,
    activeCourses: activeCourses.total || 0,
    totalBookings: totalBookings.total || 0,
    todayCheckins: todayCheckins.total || 0
  }
}

/**
 * 获取上课排行榜
 * @param {string} type - 榜单类型 'all' 或 'month'
 * @param {number} limit - 限制数量
 * @returns {Promise<Array>} 排行榜数据
 */
export const getRankingList = async (type = 'all', limit = 10) => {
  const db = getDatabase()
  const _ = db.command

  // 构建查询条件
  let whereCondition = {
    _pid: PROJECT_ID,
    JOIN_IS_CHECKIN: 1
  }

  // 月度排行榜 - 只统计本月
  if (type === 'month') {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    whereCondition.JOIN_CHECKIN_TIME = _.gte(firstDayOfMonth)
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
        checkinCount: 0
      }
    }
    userStats[userId].checkinCount++
  })

  // 转换为数组并排序
  const rankList = Object.values(userStats)
    .sort((a, b) => b.checkinCount - a.checkinCount)
    .slice(0, limit)

  return rankList
}

export default {
  initDatabase,
  getDatabase,
  getAuth,

  // 管理员
  adminLogin,
  isAdminLoggedIn,
  getCurrentAdmin,
  adminLogout,

  // 课程
  getCourseList,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,

  // 预约
  getBookingList,
  checkinBooking,
  cancelCheckin,

  // 学员
  getStudentList,
  getStudentDetail,

  // 统计
  getStatistics,
  getRankingList
}
