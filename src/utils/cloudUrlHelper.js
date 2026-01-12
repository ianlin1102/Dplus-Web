/**
 * 云存储 URL 转换工具
 * 将小程序的 cloud:// 协议转换为 Web 端可用的 HTTPS URL
 */

import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'cloud1-6gnd02he13c1ff2e'

// CloudBase 应用实例（延迟初始化）
let app = null

// URL 缓存（cloud:// -> https://）
const urlCache = new Map()

// 失败 URL 缓存（避免重复请求已知不存在的文件）
const failedUrls = new Set()

/**
 * 初始化 CloudBase
 */
const initCloudBase = async () => {
  if (app) return app

  try {
    app = cloudbase.init({
      env: ENV_ID
    })

    // 尝试匿名登录
    const auth = app.auth({ persistence: 'local' })
    const loginState = await auth.getLoginState()

    if (!loginState) {
      try {
        if (auth.signInAnonymously) {
          await auth.signInAnonymously()
        } else if (auth.anonymousAuthProvider) {
          await auth.anonymousAuthProvider().signIn()
        }
      } catch (authError) {
        console.warn('⚠️ cloudUrlHelper 匿名登录失败:', authError.message)
      }
    }

    return app
  } catch (error) {
    console.error('❌ cloudUrlHelper 初始化失败:', error)
    throw error
  }
}

/**
 * 获取临时下载 URL（异步）
 * @param {string} cloudUrl - cloud:// 格式的 URL
 * @returns {Promise<string>} HTTPS 临时下载 URL
 */
export const getTempDownloadUrl = async (cloudUrl) => {
  if (!cloudUrl) return ''

  // 如果已经是 http/https URL，直接返回
  if (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://')) {
    return cloudUrl
  }

  // 如果不是 cloud:// 协议，直接返回
  if (!cloudUrl.startsWith('cloud://')) {
    return cloudUrl
  }

  // 检查缓存
  if (urlCache.has(cloudUrl)) {
    return urlCache.get(cloudUrl)
  }

  // 检查是否已知失败的 URL（文件不存在）
  if (failedUrls.has(cloudUrl)) {
    return '' // 返回空字符串，让调用方显示占位符
  }

  try {
    await initCloudBase()

    const result = await app.getTempFileURL({
      fileList: [cloudUrl]
    })

    if (result.fileList && result.fileList[0]) {
      const fileInfo = result.fileList[0]
      if (fileInfo.tempFileURL) {
        // 缓存结果（临时 URL 有效期通常为 2 小时）
        urlCache.set(cloudUrl, fileInfo.tempFileURL)
        return fileInfo.tempFileURL
      }
      // 文件不存在错误 - 静默处理并缓存，避免重复请求
      if (fileInfo.code === 'STORAGE_FILE_NONEXIST') {
        failedUrls.add(cloudUrl)
        return '' // 返回空字符串，让调用方显示占位符
      }
      // 其他错误才输出日志
      if (fileInfo.code || fileInfo.status) {
        console.warn('云存储文件访问失败:', fileInfo.code)
      }
    }

    // 备用方案：直接使用 tcb.qcloud.la URL（可能403，但作为fallback）
    const pathMatch = cloudUrl.match(/cloud:\/\/[^/]+\/(.+)/)
    if (pathMatch && pathMatch[1]) {
      const fallbackUrl = `https://636c-cloud1-6gnd02he13c1ff2e-1380655578.tcb.qcloud.la/${pathMatch[1]}`
      return fallbackUrl
    }

    return cloudUrl
  } catch (error) {
    console.error('获取临时 URL 出错:', error)
    return cloudUrl
  }
}

/**
 * 批量获取临时下载 URL
 * @param {string[]} cloudUrls - cloud:// 格式的 URL 数组
 * @returns {Promise<Map<string, string>>} 原始 URL 到临时 URL 的映射
 */
export const getTempDownloadUrls = async (cloudUrls) => {
  if (!cloudUrls || cloudUrls.length === 0) return new Map()

  // 过滤出需要转换的 cloud:// URL（排除已缓存和已知失败的）
  const toConvert = cloudUrls.filter(url =>
    url && url.startsWith('cloud://') && !urlCache.has(url) && !failedUrls.has(url)
  )

  if (toConvert.length > 0) {
    try {
      await initCloudBase()

      const result = await app.getTempFileURL({
        fileList: toConvert
      })

      if (result.fileList) {
        result.fileList.forEach((item, index) => {
          if (item.tempFileURL) {
            urlCache.set(toConvert[index], item.tempFileURL)
          } else if (item.code === 'STORAGE_FILE_NONEXIST') {
            // 文件不存在 - 添加到失败缓存
            failedUrls.add(toConvert[index])
          }
        })
      }
    } catch (error) {
      console.error('批量获取临时 URL 出错:', error)
    }
  }

  // 构建结果映射
  const resultMap = new Map()
  cloudUrls.forEach(url => {
    if (!url || failedUrls.has(url)) {
      resultMap.set(url, '') // 失败的 URL 返回空字符串
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      resultMap.set(url, url)
    } else if (urlCache.has(url)) {
      resultMap.set(url, urlCache.get(url))
    } else {
      resultMap.set(url, url)
    }
  })

  return resultMap
}

/**
 * 同步转换 cloud:// URL（备用方案，返回直接 URL）
 * 注意：直接 URL 可能返回 403，推荐使用 getTempDownloadUrl
 * @param {string} cloudUrl - cloud:// 格式的 URL
 * @returns {string} HTTPS URL
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

  // 检查缓存（可能之前已经获取过临时 URL）
  if (urlCache.has(cloudUrl)) {
    return urlCache.get(cloudUrl)
  }

  // 检查是否已知失败的 URL（文件不存在）
  if (failedUrls.has(cloudUrl)) {
    return '' // 返回空字符串，让调用方显示占位符
  }

  // 备用方案：直接转换为 tcb.qcloud.la 域名（可能返回 403）
  try {
    const pathMatch = cloudUrl.match(/cloud:\/\/[^/]+\/(.+)/)
    if (pathMatch && pathMatch[1]) {
      const filePath = pathMatch[1]
      return `https://636c-cloud1-6gnd02he13c1ff2e-1380655578.tcb.qcloud.la/${filePath}`
    }
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
        converted[field] = converted[field].map(url => convertCloudUrl(url))
      } else if (typeof converted[field] === 'string') {
        converted[field] = convertCloudUrl(converted[field])
      }
    }
  })

  return converted
}

/**
 * 清除 URL 缓存
 */
export const clearUrlCache = () => {
  urlCache.clear()
  failedUrls.clear()
}

export default {
  convertCloudUrl,
  convertObjectUrls,
  getTempDownloadUrl,
  getTempDownloadUrls,
  clearUrlCache
}
