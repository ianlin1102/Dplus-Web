/**
 * CloudBase (腾讯云开发) 配置
 * 用于 Web 端连接微信小程序的云数据库
 */
import cloudbase from '@cloudbase/js-sdk'

// 云开发环境 ID
const ENV_ID = 'cloud1-6gnd02he13c1ff2e'

// 初始化 CloudBase
const app = cloudbase.init({
  env: ENV_ID
})

// 获取数据库引用
const db = app.database()

// 获取云存储引用
const storage = app.uploadFile

// 获取认证实例
const auth = app.auth()

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
  storage,    // 云存储实例
  auth,       // 认证实例
  ENV_ID      // 环境 ID
}

export default app
