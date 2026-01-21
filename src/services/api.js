/**
 * API 服务层
 * 封装云函数调用和数据库操作
 */
import { app, db } from './cloudbase'

/**
 * 调用云函数
 * @param {string} name - 云函数名称（例如：'cloud'）
 * @param {object} data - 传递的参数
 * @returns {Promise} 云函数返回结果
 */
export const callCloudFunction = async (name, data = {}) => {
  try {
    const result = await app.callFunction({
      name,
      data
    })
    return result.result
  } catch (error) {
    console.error(`云函数 ${name} 调用失败:`, error)
    throw error
  }
}

/**
 * 获取用户 token（与小程序端保持一致）
 * 管理员路由使用 admin token，普通路由使用用户 ID
 */
const getUserToken = (route) => {
  // 管理员路由
  if (route.indexOf('admin/') > -1) {
    const adminInfo = localStorage.getItem('admin_info')
    if (adminInfo) {
      const admin = JSON.parse(adminInfo)
      return admin.token || admin.id || ''
    }
    return ''
  }

  // 普通用户路由 - 检查 AuthContext 的缓存 (auth_info)
  const authInfo = localStorage.getItem('auth_info')
  if (authInfo) {
    try {
      const parsed = JSON.parse(authInfo)
      // auth_info 格式: { user: { id, name, role, type }, expireTime }
      if (parsed.user && parsed.user.id) {
        return parsed.user.id
      }
    } catch (e) {
      console.error('解析 auth_info 失败:', e)
    }
  }

  // 兼容旧的 auth_user 格式
  const authData = localStorage.getItem('auth_user')
  if (authData) {
    try {
      const user = JSON.parse(authData)
      return user._id || user.USER_MINI_OPENID || ''
    } catch (e) {
      console.error('解析 auth_user 失败:', e)
    }
  }

  return ''
}

/**
 * 调用云路由（与小程序端 cloudHelper.callCloudData 保持一致）
 * @param {string} route - 路由路径（例如：'checkin/rank_list'）
 * @param {object} params - 路由参数
 * @returns {Promise} 返回数据
 */
export const callCloudRoute = async (route, params = {}) => {
  try {
    const token = getUserToken(route)
    const PID = 'A00'  // 项目 ID，与小程序端保持一致

    // 参数格式与小程序端保持一致: { route, token, PID, params }
    const result = await callCloudFunction('cloud', {
      route,
      token,
      PID,
      params  // params 作为嵌套对象传递，不是展开
    })

    // 云函数成功返回 code: 200
    if (result && result.code === 200) {
      return result
    } else {
      throw new Error(result.msg || '请求失败')
    }
  } catch (error) {
    console.error(`路由 ${route} 调用失败:`, error)
    throw error
  }
}

/**
 * 获取上课排行榜数据
 * @param {string} type - 榜单类型 'all' 或 'month'
 * @param {number} limit - 限制数量，默认 10
 * @returns {Promise} 排行榜数据
 */
export const getRankList = async (type = 'all', limit = 10) => {
  try {
    const result = await callCloudRoute('checkin/rank_list', {
      type,
      limit
    })
    return result
  } catch (error) {
    console.error('获取排行榜失败:', error)
    throw error
  }
}

/**
 * 清除排行榜缓存
 * @returns {Promise}
 */
export const clearRankCache = async () => {
  try {
    const result = await callCloudRoute('checkin/clear_cache')
    return result
  } catch (error) {
    console.error('清除排行榜缓存失败:', error)
    throw error
  }
}

/**
 * 数据库查询示例
 * 直接查询数据库集合
 */
export const getDatabaseCollection = (collectionName) => {
  return db.collection(collectionName)
}

/**
 * 查询用户数据示例
 * @param {number} limit - 限制数量
 * @returns {Promise} 用户列表
 */
export const getUsers = async (limit = 20) => {
  try {
    const result = await db.collection('user')
      .limit(limit)
      .get()
    return result.data
  } catch (error) {
    console.error('查询用户数据失败:', error)
    throw error
  }
}

/**
 * 查询课程/活动数据
 * @param {object} options - 查询选项
 * @returns {Promise} 课程列表
 */
export const getMeetList = async (options = {}) => {
  const {
    limit = 20,
    orderBy = 'MEET_ORDER',
    orderType = 'asc',
    status = 1 // MEET_STATUS: 1 = 正常
  } = options

  try {
    const result = await db.collection('meet')
      .where({
        MEET_STATUS: status
      })
      .orderBy(orderBy, orderType)
      .limit(limit)
      .get()

    return result.data
  } catch (error) {
    console.error('查询课程数据失败:', error)
    throw error
  }
}

/**
 * 获取用户详情
 * @returns {Promise} 用户详细信息
 */
export const getMyDetail = async () => {
  try {
    const result = await callCloudRoute('my/detail', {})
    return result
  } catch (error) {
    console.error('获取用户详情失败:', error)
    throw error
  }
}

/**
 * 编辑用户基本信息
 * @param {object} data - 用户信息 { name, mobile, city, work, trade }
 * @returns {Promise}
 */
export const editUserBase = async (data) => {
  try {
    const result = await callCloudRoute('my/edit_base', data)
    return result
  } catch (error) {
    console.error('编辑用户信息失败:', error)
    throw error
  }
}

export default {
  callCloudFunction,
  callCloudRoute,
  getRankList,
  clearRankCache,
  getDatabaseCollection,
  getUsers,
  getMeetList,
  getMyDetail,
  editUserBase
}
