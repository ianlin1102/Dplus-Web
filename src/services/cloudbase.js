/**
 * CloudBase (腾讯云开发) 配置
 * 用于 Web 端连接微信小程序的云数据库
 */
import cloudbaseSDK from '@cloudbase/js-sdk'

// 云开发环境 ID
const ENV_ID = 'cloud1-6gnd02he13c1ff2e'

// 云存储默认域名（公开访问）
export const STORAGE_DOMAIN = '636c-cloud1-6gnd02he13c1ff2e-1380655578.tcb.qcloud.la'

// 初始化 CloudBase（无需 accessKey，使用匿名访问）
const app = cloudbaseSDK.init({
  env: ENV_ID,
  region: 'ap-shanghai'
})

// 获取数据库引用
const db = app.database()

// 获取认证实例
const auth = app.auth()

/**
 * 云存储操作
 */

/**
 * 将 cloud:// 格式的 fileID 转换为可直接访问的 HTTPS URL
 * @param {string} fileID - 格式: cloud://env-id.xxx/path/to/file.jpg
 * @returns {string} HTTPS URL
 */
export const fileIDToURL = (fileID) => {
  if (!fileID) return ''

  // 如果已经是 http(s) 链接，直接返回
  if (fileID.startsWith('http://') || fileID.startsWith('https://')) {
    return fileID
  }

  // 解析 cloud:// 格式
  // 格式: cloud://env-id.storage-id/path/to/file
  if (fileID.startsWith('cloud://')) {
    const path = fileID.replace('cloud://', '')
    const slashIndex = path.indexOf('/')
    if (slashIndex > 0) {
      const filePath = path.substring(slashIndex + 1)
      return `https://${STORAGE_DOMAIN}/${filePath}`
    }
  }

  // 如果只是路径，直接拼接
  return `https://${STORAGE_DOMAIN}/${fileID}`
}

// 上传文件（需要登录）
export const uploadFile = async ({ cloudPath, filePath, onUploadProgress }) => {
  try {
    const result = await app.uploadFile({
      cloudPath,
      filePath,
      onUploadProgress
    })
    return result
  } catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}

// 获取文件临时下载链接（SDK 方式）
export const getTempFileURL = async (fileList) => {
  try {
    const result = await app.getTempFileURL({ fileList })
    return result
  } catch (error) {
    console.error('获取文件链接失败:', error)
    throw error
  }
}

// 删除文件（需要登录）
export const deleteFile = async (fileList) => {
  try {
    const result = await app.deleteFile({ fileList })
    return result
  } catch (error) {
    console.error('删除文件失败:', error)
    throw error
  }
}

// 下载文件
export const downloadFile = async (fileID) => {
  try {
    const result = await app.downloadFile({ fileID })
    return result
  } catch (error) {
    console.error('下载文件失败:', error)
    throw error
  }
}

/**
 * 匿名登录
 * 用于测试和开发，需要在云控制台开启匿名登录
 */
export const loginAnonymously = async () => {
  try {
    const loginState = await auth.getLoginState()

    if (loginState) {
      console.log('已登录，用户信息:', loginState)
      return loginState
    }

    // 执行匿名登录
    const result = await auth.anonymousAuthProvider().signIn()
    console.log('匿名登录成功:', result)
    return result
  } catch (error) {
    console.error('匿名登录失败:', error)
    throw error
  }
}

/**
 * 自定义登录
 * @param {string} ticket - 自定义登录票据
 */
export const loginWithTicket = async (ticket) => {
  try {
    const result = await auth.customAuthProvider().signIn(ticket)
    console.log('自定义登录成功:', result)
    return result
  } catch (error) {
    console.error('自定义登录失败:', error)
    throw error
  }
}

/**
 * 获取当前登录状态
 */
export const getLoginState = async () => {
  try {
    const loginState = await auth.getLoginState()
    return loginState
  } catch (error) {
    console.error('获取登录状态失败:', error)
    return null
  }
}

/**
 * 登出
 */
export const logout = async () => {
  try {
    await auth.signOut()
    console.log('已登出')
  } catch (error) {
    console.error('登出失败:', error)
    throw error
  }
}

// 导出常用功能
export {
  app,        // CloudBase 应用实例
  db,         // 数据库实例
  auth,       // 认证实例
  ENV_ID      // 环境 ID
}

export default app
