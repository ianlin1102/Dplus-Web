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
  if (app && db) return app

  try {
    app = cloudbase.init({
      env: ENV_ID
    })

    auth = app.auth({ persistence: 'local' })
    db = app.database()

    // 检查登录状态
    const loginState = await auth.getLoginState()

    if (!loginState) {
      // 尝试匿名登录（兼容新旧 API）
      try {
        if (auth.signInAnonymously) {
          await auth.signInAnonymously()
        } else if (auth.anonymousAuthProvider) {
          await auth.anonymousAuthProvider().signIn()
        }
        console.log('✅ CloudBase 匿名登录成功')
      } catch (authError) {
        console.warn('⚠️ 匿名登录失败，尝试继续:', authError.message)
        // 即使匿名登录失败，也尝试继续（某些操作可能不需要认证）
      }
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

// 云函数 HTTP 触发器地址 (使用与 httpApi.js 相同的地址)
const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL ||
  'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

/**
 * 管理员登录
 * 调用云函数 admin/login 获取 JWT token
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 管理员信息
 */
export const adminLogin = async (username, password) => {
  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'admin/login',
        PID: 'A00',
        params: {
          name: username,
          pwd: password
        }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    // 云函数返回格式: { code: 200, data: { token, jwtToken, name, type, ... } }
    if (result.code !== 200) {
      throw new Error(result.msg || '登录失败')
    }

    const data = result.data

    // 保存登录信息到本地（包含 JWT token 用于后续 Admin API 调用）
    localStorage.setItem('admin_info', JSON.stringify({
      id: data.userId,
      name: data.name,
      type: data.type,
      token: data.jwtToken,  // JWT token 用于 HTTP 认证
      legacyToken: data.token,  // 传统 token（小程序兼容）
      role: data.role,
      lastLogin: data.last,
      loginCount: data.cnt
    }))

    return {
      _id: data.userId,
      ADMIN_NAME: data.name,
      ADMIN_TYPE: data.type,
      jwtToken: data.jwtToken
    }
  } catch (error) {
    console.error('管理员登录失败:', error)
    throw new Error(error.message || '登录失败，请检查账号密码')
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
 * 支持所有用户类型：微信用户、Web用户、Google用户
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 学员列表
 */
export const getStudentList = async (options = {}) => {
  const db = getDatabase()
  const _ = db.command
  const {
    search = '',
    page = 1,
    limit = 20
  } = options

  // 不再强制要求 _pid，这样可以显示所有用户类型
  // - 微信用户：有 _pid 和 USER_MINI_OPENID
  // - Web 用户：有 USER_ACCOUNT（可能没有 _pid）
  // - Google 用户：有 USER_GOOGLE_ID（未来支持）
  let query = db.collection('ax_user')

  // 搜索条件
  if (search) {
    query = query.where(_.or([
      { USER_NAME: db.RegExp({ regexp: search, options: 'i' }) },
      { USER_MOBILE: db.RegExp({ regexp: search, options: 'i' }) },
      { USER_ACCOUNT: db.RegExp({ regexp: search, options: 'i' }) }
    ]))
  }

  const skip = (page - 1) * limit

  const [listResult, countResult] = await Promise.all([
    query.orderBy('_createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get(),
    query.count()
  ])

  // 为每个用户添加来源标签
  const users = (listResult.data || []).map(user => ({
    ...user,
    // 用户来源标识
    USER_SOURCE_TYPE: user.USER_MINI_OPENID ? 'wechat' :
                      user.USER_GOOGLE_ID ? 'google' :
                      user.USER_ACCOUNT ? 'web' : 'unknown'
  }))

  return {
    list: users,
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
