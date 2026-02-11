/**
 * 卡项商城服务
 * 使用 CloudBase SDK 直接访问数据库
 */

import { getDatabase, initDatabase } from './databaseService'
import { uploadPaymentProofHTTP, createPurchaseOrderHTTP } from './httpApi'

/**
 * 获取卡项列表
 * @param {Object} options - 查询选项
 * @param {number} options.limit - 限制数量
 * @param {string} options.status - 状态筛选 (1:上架, 0:下架)
 * @returns {Promise<Array>} 卡项列表
 */
export const getCardList = async (options = {}) => {
  try {
    await initDatabase()
    const db = getDatabase()
    const { limit = 20, status = 1 } = options

    let query = db.collection('ax_card_item')

    // 筛选上架的卡项
    if (status !== undefined) {
      query = query.where({
        CARD_STATUS: status
      })
    }

    // 按排序号排序
    query = query.orderBy('CARD_ORDER', 'asc')

    // 限制数量
    query = query.limit(limit)

    const res = await query.get()
    return res.data || []
  } catch (error) {
    console.error('获取卡项列表失败:', error)
    throw error
  }
}

/**
 * 获取首页推荐卡项
 * @param {number} limit - 限制数量，默认 6
 * @returns {Promise<Array>} 卡项列表
 */
export const getHomeCardList = async (limit = 6) => {
  try {
    await initDatabase()
    const db = getDatabase()
    const res = await db.collection('ax_card_item')
      .where({
        CARD_STATUS: 1,  // 只显示上架的
        CARD_HOME: db.command.gt(0)   // 推荐的卡项（CARD_HOME > 0）
      })
      .orderBy('CARD_HOME', 'desc')
      .orderBy('CARD_ORDER', 'asc')
      .limit(limit)
      .get()

    return res.data || []
  } catch (error) {
    console.error('获取首页卡项失败:', error)
    throw error
  }
}

/**
 * 获取卡项详情
 * @param {string} cardId - 卡项 ID
 * @returns {Promise<Object>} 卡项详情
 */
export const getCardDetail = async (cardId) => {
  try {
    await initDatabase()
    const db = getDatabase()
    const res = await db.collection('ax_card_item')
      .where({
        _id: cardId
      })
      .get()

    if (res.data && res.data.length > 0) {
      return res.data[0]
    }
    throw new Error('卡项不存在')
  } catch (error) {
    console.error('获取卡项详情失败:', error)
    throw error
  }
}

/**
 * 获取用户的卡项列表
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @param {boolean} options.includeExpired - 是否包含过期卡项，默认 false
 * @returns {Promise<Array>} 用户卡项列表
 */
export const getMyCards = async (userId, options = {}) => {
  try {
    await initDatabase()
    const db = getDatabase()
    const { includeExpired = false } = options

    // USER_CARD_STATUS: 0=已用完, 1=使用中, 2=已过期
    const res = await db.collection('ax_user_card')
      .where({
        USER_CARD_USER_ID: userId,
        USER_CARD_STATUS: 1  // 使用中的卡项（整数）
      })
      .orderBy('USER_CARD_ADD_TIME', 'desc')
      .get()

    let cards = res.data || []

    // 过滤过期卡项
    if (!includeExpired) {
      const now = Date.now()
      cards = cards.filter(card => {
        // 如果没有设置过期时间或为0，认为永不过期
        if (!card.USER_CARD_EXPIRE_TIME || card.USER_CARD_EXPIRE_TIME === 0) {
          return true
        }
        // 检查过期时间
        return card.USER_CARD_EXPIRE_TIME > now
      })
    }

    return cards
  } catch (error) {
    console.error('获取我的卡项失败:', error)
    throw error
  }
}

/**
 * 获取用户的卡项历史（包含过期卡项）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 用户卡项列表（含过期）
 */
export const getMyCardHistory = async (userId) => {
  return getMyCards(userId, { includeExpired: true })
}

/**
 * 获取用户卡项详情
 * @param {string} userCardId - 用户卡项 ID
 * @returns {Promise<Object>} 卡项详情
 */
export const getMyCardDetail = async (userCardId) => {
  try {
    await initDatabase()
    const db = getDatabase()
    const res = await db.collection('ax_user_card')
      .doc(userCardId)
      .get()

    if (res.data && res.data.length > 0) {
      return res.data[0]
    }
    throw new Error('卡项不存在')
  } catch (error) {
    console.error('获取卡项详情失败:', error)
    throw error
  }
}

/**
 * 获取用户卡项使用记录
 * @param {string} userCardId - 用户卡项 ID
 * @returns {Promise<Array>} 使用记录
 */
export const getMyCardRecords = async (userCardId) => {
  try {
    await initDatabase()
    const db = getDatabase()
    const res = await db.collection('ax_card_record')
      .where({
        CARD_RECORD_USER_CARD_ID: userCardId
      })
      .orderBy('CARD_RECORD_ADD_TIME', 'desc')
      .get()

    return res.data || []
  } catch (error) {
    console.error('获取卡项使用记录失败:', error)
    throw error
  }
}

/**
 * 获取用户卡项汇总
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 卡项汇总统计
 */
export const getMyCardSummary = async (userId) => {
  try {
    const cards = await getMyCards(userId)

    // 统计总次数、剩余次数、余额
    let totalTimes = 0
    let remainTimes = 0
    let totalAmount = 0
    let remainAmount = 0
    let expiredCount = 0
    let timesCardsCount = 0
    let balanceCardsCount = 0

    const now = Date.now()

    cards.forEach(card => {
      // 检查是否过期
      if (card.USER_CARD_EXPIRE_TIME && card.USER_CARD_EXPIRE_TIME > 0 && card.USER_CARD_EXPIRE_TIME < now) {
        expiredCount++
        return
      }

      // 次数卡 (USER_CARD_TYPE === 1)
      if (card.USER_CARD_TYPE === 1) {
        timesCardsCount++
        totalTimes += card.USER_CARD_TOTAL_TIMES || 0
        remainTimes += card.USER_CARD_REMAIN_TIMES || 0
      }
      // 余额卡 (USER_CARD_TYPE === 2)
      else if (card.USER_CARD_TYPE === 2) {
        balanceCardsCount++
        totalAmount += card.USER_CARD_TOTAL_AMOUNT || 0
        remainAmount += card.USER_CARD_REMAIN_AMOUNT || 0
      }
    })

    return {
      totalCards: cards.length,       // 总卡项数
      timesCardsCount,                // 次数卡数量
      balanceCardsCount,              // 余额卡数量
      totalTimes,                     // 总次数
      remainTimes,                    // 剩余次数
      totalAmount,                    // 总金额
      remainAmount,                   // 剩余金额
      expiredCount,                   // 过期卡项数
      activeCards: cards.length - expiredCount  // 有效卡项数
    }
  } catch (error) {
    console.error('获取卡项汇总失败:', error)
    throw error
  }
}

/**
 * 生成唯一购买识别码
 * 格式: 年月日时分秒 + 4位随机数
 */
const generatePurchaseId = () => {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PUR${dateStr}${random}`
}

/**
 * 创建购买订单
 * @param {Object} params - 购买参数
 * @param {string} params.cardId - 卡项 ID
 * @param {string} params.userId - 用户 ID (可选，匿名用户为空)
 * @param {string} params.userName - 用户名称
 * @param {string} params.userPhone - 用户手机号
 * @param {string} params.paymentMethod - 支付方式 (zelle/cash/card)
 * @param {Object} params.cardInfo - 卡项信息
 * @returns {Promise<Object>} 购买订单信息
 */
export const createPurchaseOrder = async (params) => {
  try {
    await initDatabase()
    const db = getDatabase()

    const { cardId, userId, userName, userPhone, paymentMethod, cardInfo } = params

    const purchaseId = generatePurchaseId()
    const now = Date.now()

    // 创建购买记录
    const purchaseRecord = {
      PURCHASE_ID: purchaseId,                    // 购买识别码
      PURCHASE_CARD_ID: cardId,                   // 卡项 ID
      PURCHASE_CARD_TITLE: cardInfo.CARD_TITLE || cardInfo.name || '',  // 卡项名称
      PURCHASE_CARD_PRICE: cardInfo.CARD_PRICE || cardInfo.price || 0,  // 卡项价格
      PURCHASE_CARD_TYPE: cardInfo.CARD_TYPE || 0,                      // 卡项类型
      PURCHASE_USER_ID: userId || '',              // 用户 ID
      PURCHASE_USER_NAME: userName || '',          // 用户名称
      PURCHASE_USER_PHONE: userPhone || '',        // 用户手机号
      PURCHASE_PAYMENT_METHOD: paymentMethod,      // 支付方式
      PURCHASE_STATUS: 0,                          // 状态: 0-待支付, 1-已支付待确认, 2-已完成, 3-已取消
      PURCHASE_PROOF_URL: '',                      // 支付凭证 URL
      PURCHASE_ADD_TIME: now,                      // 创建时间
      PURCHASE_UPDATE_TIME: now,                   // 更新时间
      PURCHASE_CONFIRM_TIME: 0,                    // 确认时间
      PURCHASE_REMARK: '',                         // 备注
    }

    // 保存到 ax_purchase_history 集合
    const result = await db.collection('ax_purchase_history').add(purchaseRecord)

    return {
      success: true,
      purchaseId,
      recordId: result.id,
      message: paymentMethod === 'zelle'
        ? '订单已创建，请完成 Zelle 转账后上传凭证'
        : '订单已创建，请到店完成支付',
    }
  } catch (error) {
    console.error('创建购买订单失败:', error)
    throw error
  }
}

/**
 * 将文件转换为 Base64
 * @param {File} file - 文件对象
 * @returns {Promise<string>} Base64 字符串（含前缀）
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

/**
 * 压缩图片
 * @param {string} base64 - Base64 字符串
 * @param {number} maxWidth - 最大宽度
 * @param {number} quality - 压缩质量 0-1
 * @param {number} maxSizeKB - 最大文件大小（KB），超过会继续压缩
 * @returns {Promise<string>} 压缩后的 Base64（含前缀）
 */
const compressImage = (base64, maxWidth = 600, quality = 0.6, maxSizeKB = 500) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // 计算缩放比例
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // 转为 JPEG 并压缩，如果仍然太大则继续降低质量
      let compressed = canvas.toDataURL('image/jpeg', quality)
      let currentQuality = quality

      // 如果超过大小限制，继续压缩
      while (compressed.length > maxSizeKB * 1024 * 1.37 && currentQuality > 0.3) {
        currentQuality -= 0.1
        compressed = canvas.toDataURL('image/jpeg', currentQuality)
        console.log(`图片压缩: quality=${currentQuality.toFixed(1)}, size=${Math.round(compressed.length / 1024)}KB`)
      }

      resolve(compressed)
    }
    img.src = base64
  })
}

/**
 * 上传支付凭证到云存储
 * @param {string} purchaseId - 购买识别码
 * @param {File} file - 凭证文件
 * @param {Function} onProgress - 上传进度回调
 * @returns {Promise<Object>} 上传结果
 */
export const uploadPaymentProof = async (purchaseId, file, onProgress) => {
  try {
    // 开始读取文件
    onProgress?.(10)

    // 将文件转换为 Base64
    const base64WithPrefix = await fileToBase64(file)
    onProgress?.(30)

    // 压缩图片（限制 500KB 以避免 HTTP 413 错误）
    const compressedBase64 = await compressImage(base64WithPrefix, 600, 0.6, 500)
    onProgress?.(50)

    // 提取纯 base64 数据（去掉 data:image/xxx;base64, 前缀）
    const base64Data = compressedBase64.split(',')[1]

    // 通过 HTTP API 上传到云存储
    onProgress?.(70)
    const result = await uploadPaymentProofHTTP(purchaseId, base64Data, 'jpg')
    onProgress?.(100)

    console.log('凭证上传成功:', result)

    return {
      success: true,
      fileID: result.data?.fileID || '',
      message: '凭证上传成功，请等待工作人员确认'
    }
  } catch (error) {
    console.error('上传支付凭证失败:', error)
    throw error
  }
}

/**
 * 更新购买记录的支付凭证
 * @param {string} purchaseId - 购买识别码
 * @param {string} proofUrl - 凭证 URL
 */
export const updatePurchaseProof = async (purchaseId, proofUrl) => {
  try {
    await initDatabase()
    const db = getDatabase()

    await db.collection('ax_purchase_history')
      .where({ PURCHASE_ID: purchaseId })
      .update({
        PURCHASE_PROOF_URL: proofUrl,
        PURCHASE_STATUS: 1,  // 更新状态为已支付待确认
        PURCHASE_UPDATE_TIME: Date.now()
      })
  } catch (error) {
    console.error('更新支付凭证失败:', error)
    throw error
  }
}

/**
 * 获取用户的购买记录
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} 购买记录列表
 */
export const getPurchaseHistory = async (userId) => {
  try {
    await initDatabase()
    const db = getDatabase()

    const res = await db.collection('ax_purchase_history')
      .where({
        PURCHASE_USER_ID: userId
      })
      .orderBy('PURCHASE_ADD_TIME', 'desc')
      .limit(50)
      .get()

    return res.data || []
  } catch (error) {
    console.error('获取购买记录失败:', error)
    throw error
  }
}

/**
 * 获取购买记录详情
 * @param {string} purchaseId - 购买识别码
 * @returns {Promise<Object>} 购买记录详情
 */
export const getPurchaseDetail = async (purchaseId) => {
  try {
    await initDatabase()
    const db = getDatabase()

    const res = await db.collection('ax_purchase_history')
      .where({
        PURCHASE_ID: purchaseId
      })
      .get()

    if (res.data && res.data.length > 0) {
      return res.data[0]
    }
    throw new Error('购买记录不存在')
  } catch (error) {
    console.error('获取购买记录详情失败:', error)
    throw error
  }
}

/**
 * 取消购买订单（用户关闭上传弹窗但未上传凭证时调用）
 * @param {string} purchaseId - 购买识别码
 * @returns {Promise<Object>} 结果
 */
export const cancelPurchaseOrder = async (purchaseId) => {
  try {
    await initDatabase()
    const db = getDatabase()

    // 更新订单状态为已取消
    await db.collection('ax_purchase_history')
      .where({ PURCHASE_ID: purchaseId })
      .update({
        PURCHASE_STATUS: 3,  // 3=已取消
        PURCHASE_UPDATE_TIME: Date.now(),
        PURCHASE_REMARK: '用户未上传凭证，订单自动取消'
      })

    return { success: true, message: '订单已取消' }
  } catch (error) {
    console.error('取消购买订单失败:', error)
    // 取消失败不抛出错误，避免影响用户体验
    return { success: false, message: '取消订单失败' }
  }
}

export default {
  getCardList,
  getHomeCardList,
  getCardDetail,
  getMyCards,
  getMyCardHistory,
  getMyCardDetail,
  getMyCardRecords,
  getMyCardSummary,
  // 购买相关
  createPurchaseOrder,
  uploadPaymentProof,
  updatePurchaseProof,
  cancelPurchaseOrder,
  getPurchaseHistory,
  getPurchaseDetail,
}
