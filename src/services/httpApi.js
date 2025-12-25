/**
 * HTTP API 服务层（免费套餐替代方案）
 * 通过 HTTP 触发器调用云函数，不需要配置 Web 安全域名
 */

// 云函数 HTTP 访问地址
// 从腾讯云控制台 → 云开发 → HTTP 访问服务 中获取
// 当前地址：https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud
const CLOUD_FUNCTION_HTTP_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL ||
  'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

// 服务端 API Key (从腾讯云控制台获取)
// 这是一个 JWT token，用于 HTTP 访问服务的认证
const API_KEY = import.meta.env.VITE_TCB_API_KEY ||
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJhdWQiOiJjbG91ZDEtNmduZDAyaGUxM2MxZmYyZSIsImV4cCI6MjUzNDAyMzAwNzk5LCJpYXQiOjE3NjY2MzI0ODgsImF0X2hhc2giOiIzcmdfanVFX0VmQzRqVkpVQUd2TVhRIiwicHJvamVjdF9pZCI6ImNsb3VkMS02Z25kMDJoZTEzYzFmZjJlIiwibWV0YSI6eyJwbGF0Zm9ybSI6IkFwaUtleSJ9LCJhZG1pbmlzdHJhdG9yX2lkIjoiMTk3MTU4NTUwMjcxNTQ2OTgyNiIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3NlcnZlciIsImlzX3N5c3RlbV9hZG1pbiI6dHJ1ZX0.iA1icVKlTUK6cOcIYZb9JbCi1lo-l28kTn43nbob5t4e-L1ujbCxstTKkuX1EKyR63BZ5yWqYHZi0tyOZiomSTcKhtFTcXfCG8vKx3499_gNeFU70TzD1Cmd0yIeuxJZSJ5hmccsjk9q1N7ZsrupHGrJSSzaqEaV1Uv6tWi24N12J5J0aBrog2bhXXjseOF0829jK48a6qTAM5B_dw4J-Qu7-Xmw2G_ZsWwdUKx20bqX4-IpRMzzne4xojnFg7mKI-IbWNmDuWm3oIidAnpSEhd0HdhCUvoGCRobTQvbR92lPX22fmt2l0x0poZJYqbjeLnrodXL69_PDaO8hALO1g'

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
        'Authorization': `Bearer ${API_KEY}`,  // 添加认证头
        'X-CloudBase-Credentials': API_KEY      // CloudBase 认证
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
