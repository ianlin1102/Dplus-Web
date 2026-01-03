/**
 * 云存储 URL 转换工具
 * 将小程序的 cloud:// 协议转换为 Web 端可用的 HTTPS URL
 */

// 云存储 HTTP 访问域名
// 从腾讯云控制台 → 云开发 → 存储 → 设置 中获取
const CLOUD_STORAGE_DOMAIN = 'https://cloud1-6gnd02he13c1ff2e-1380655578.tcb.qcloud.la'

/**
 * 转换 cloud:// URL 为 HTTPS URL
 * @param {string} cloudUrl - cloud:// 格式的 URL
 * @returns {string} HTTPS URL
 *
 * @example
 * // 输入: cloud://cloud1-6gnd02he13c1ff2e.636c-cloud1-6gnd02he13c1ff2e-1380655578/instructor/1762569816719_701526.jpg
 * // 输出: https://cloud1-6gnd02he13c1ff2e-1380655578.tcb.qcloud.la/instructor/1762569816719_701526.jpg
 */
export const convertCloudUrl = (cloudUrl) => {
  if (!cloudUrl) return ''

  // 如果已经是 http/https URL，直接返回
  if (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://')) {
    return cloudUrl
  }

  // 如果不是 cloud:// 协议，直接返回
  if (!cloudUrl.startsWith('cloud://')) {
    return cloudUrl
  }

  try {
    // 格式: cloud://cloud1-6gnd02he13c1ff2e.636c-cloud1-6gnd02he13c1ff2e-1380655578/path/to/file.jpg
    // 提取路径部分（第一个 / 之后的所有内容）
    const pathMatch = cloudUrl.match(/cloud:\/\/[^/]+\/(.+)/)

    if (pathMatch && pathMatch[1]) {
      const filePath = pathMatch[1]
      return `${CLOUD_STORAGE_DOMAIN}/${filePath}`
    }

    console.warn('无法解析 cloud:// URL:', cloudUrl)
    return cloudUrl
  } catch (error) {
    console.error('转换 cloud:// URL 失败:', error)
    return cloudUrl
  }
}

/**
 * 批量转换对象中的 cloud:// URL
 * @param {object} obj - 包含 URL 的对象
 * @param {string[]} fields - 需要转换的字段名数组
 * @returns {object} 转换后的对象
 */
export const convertObjectUrls = (obj, fields = []) => {
  if (!obj || typeof obj !== 'object') return obj

  const converted = { ...obj }

  fields.forEach(field => {
    if (converted[field]) {
      if (Array.isArray(converted[field])) {
        // 处理数组类型的字段（如图片数组）
        converted[field] = converted[field].map(url => convertCloudUrl(url))
      } else if (typeof converted[field] === 'string') {
        // 处理字符串类型的字段
        converted[field] = convertCloudUrl(converted[field])
      }
    }
  })

  return converted
}

export default {
  convertCloudUrl,
  convertObjectUrls
}
