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
 * 调用云路由（类似小程序的 cloudHelper.callCloudData）
 * @param {string} route - 路由路径（例如：'checkin/rank_list'）
 * @param {object} params - 路由参数
 * @returns {Promise} 返回数据
 */
export const callCloudRoute = async (route, params = {}) => {
  try {
    const result = await callCloudFunction('cloud', {
      route,
      ...params
    })

    if (result && result.code === 0) {
      return result.data
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

export default {
  callCloudFunction,
  callCloudRoute,
  getRankList,
  clearRankCache,
  getDatabaseCollection,
  getUsers,
  getMeetList
}
