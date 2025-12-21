/**
 * 安全 API 服务层
 * 带 API Key 验证的 HTTP 请求封装
 */

// 从环境变量读取配置
const API_KEY = import.meta.env.VITE_API_KEY || ''
const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL || ''

/**
 * 带安全验证的云路由调用
 * @param {string} route - 路由路径
 * @param {object} params - 参数
 * @returns {Promise}
 */
export const callSecureCloudRoute = async (route, params = {}) => {
  if (!CLOUD_FUNCTION_URL) {
    throw new Error('未配置云函数地址，请检查 .env 文件中的 VITE_CLOUD_FUNCTION_URL')
  }

  if (!API_KEY) {
    console.warn('警告：未配置 API Key，请求可能被拒绝')
  }

  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,  // 添加 API Key
      },
      body: JSON.stringify({
        route,
        ...params,
        timestamp: Date.now()  // 添加时间戳
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    // 处理各种错误码
    if (result.code === 401) {
      throw new Error('API Key 无效，请检查配置')
    } else if (result.code === 403) {
      throw new Error('访问被拒绝：' + result.msg)
    } else if (result.code === 429) {
      throw new Error('请求过于频繁，请稍后再试')
    } else if (result.code !== 0) {
      throw new Error(result.msg || '请求失败')
    }

    return result.data

  } catch (error) {
    console.error(`路由 ${route} 调用失败:`, error)
    throw error
  }
}

/**
 * 获取上课排行榜数据（安全版本）
 * @param {string} type - 榜单类型 'all' 或 'month'
 * @param {number} limit - 限制数量，默认 10
 * @returns {Promise} 排行榜数据
 */
export const getRankList = async (type = 'all', limit = 10) => {
  try {
    const result = await callSecureCloudRoute('checkin/rank_list', {
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
 * 清除排行榜缓存（安全版本）
 * @returns {Promise}
 */
export const clearRankCache = async () => {
  try {
    const result = await callSecureCloudRoute('checkin/clear_cache')
    return result
  } catch (error) {
    console.error('清除排行榜缓存失败:', error)
    throw error
  }
}

/**
 * 检查配置状态
 * @returns {object} 配置状态信息
 */
export const checkConfig = () => {
  return {
    hasApiKey: !!API_KEY,
    hasCloudUrl: !!CLOUD_FUNCTION_URL,
    cloudUrl: CLOUD_FUNCTION_URL ? CLOUD_FUNCTION_URL.substring(0, 30) + '...' : '未配置'
  }
}

export default {
  callSecureCloudRoute,
  getRankList,
  clearRankCache,
  checkConfig
}
