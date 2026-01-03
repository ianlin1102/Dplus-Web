import { callCloudRouteHTTP } from './httpApi'

/**
 * 获取签到排行榜
 * @param {string} type - 榜单类型 'all' | 'month'
 * @param {number} limit - 返回记录数，默认10条
 * @returns {Promise} API响应
 */
export const getCheckInRanking = async (type = 'all', limit = 10) => {
  return await callCloudRouteHTTP('checkin/rank_list', { type, limit })
}

/**
 * 清除排行榜缓存
 * @returns {Promise} API响应
 */
export const clearRankingCache = async () => {
  return await callCloudRouteHTTP('checkin/clear_cache', {})
}
