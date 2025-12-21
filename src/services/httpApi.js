/**
 * HTTP API 服务层（免费套餐替代方案）
 * 通过 HTTP 触发器调用云函数，不需要配置 Web 安全域名
 */

// 云函数 HTTP 访问地址
// 你需要在云控制台为 'cloud' 云函数开启 HTTP 访问服务，会得到类似这样的地址：
// https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud
const CLOUD_FUNCTION_HTTP_URL = 'YOUR_CLOUD_FUNCTION_HTTP_URL'

/**
 * 通过 HTTP 调用云路由
 * @param {string} route - 路由路径（例如：'checkin/rank_list'）
 * @param {object} params - 路由参数
 * @returns {Promise} 返回数据
 */
export const callCloudRouteHTTP = async (route, params = {}) => {
  try {
    const response = await fetch(CLOUD_FUNCTION_HTTP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route,
        ...params
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (result && result.code === 0) {
      return result.data
    } else {
      throw new Error(result.msg || '请求失败')
    }
  } catch (error) {
    console.error(`HTTP 路由 ${route} 调用失败:`, error)
    throw error
  }
}

/**
 * 获取上课排行榜数据
 * @param {string} type - 榜单类型 'all' 或 'month'
 * @param {number} limit - 限制数量，默认 10
 * @returns {Promise} 排行榜数据
 */
export const getRankListHTTP = async (type = 'all', limit = 10) => {
  try {
    const result = await callCloudRouteHTTP('checkin/rank_list', {
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
export const clearRankCacheHTTP = async () => {
  try {
    const result = await callCloudRouteHTTP('checkin/clear_cache')
    return result
  } catch (error) {
    console.error('清除排行榜缓存失败:', error)
    throw error
  }
}

export default {
  callCloudRouteHTTP,
  getRankListHTTP,
  clearRankCacheHTTP
}
