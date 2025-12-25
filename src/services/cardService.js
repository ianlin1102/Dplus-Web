/**
 * 卡项商城服务
 * 使用 CloudBase SDK 直接访问数据库
 */

import { db } from './databaseService'

/**
 * 获取卡项列表
 * @param {Object} options - 查询选项
 * @param {number} options.limit - 限制数量
 * @param {string} options.status - 状态筛选 (1:上架, 0:下架)
 * @returns {Promise<Array>} 卡项列表
 */
export const getCardList = async (options = {}) => {
  try {
    const { limit = 20, status = '1' } = options

    let query = db.collection('ax_card_item')

    // 筛选上架的卡项
    if (status) {
      query = query.where({
        CARD_ITEM_STATUS: status
      })
    }

    // 按排序号排序
    query = query.orderBy('CARD_ITEM_ORDER', 'asc')

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
    const res = await db.collection('ax_card_item')
      .where({
        CARD_ITEM_STATUS: '1',  // 只显示上架的
        CARD_ITEM_VOUCH: true   // 推荐的卡项
      })
      .orderBy('CARD_ITEM_ORDER', 'asc')
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
    const res = await db.collection('ax_card_item')
      .doc(cardId)
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
 * @returns {Promise<Array>} 用户卡项列表
 */
export const getMyCards = async (userId) => {
  try {
    const res = await db.collection('ax_user_card')
      .where({
        USER_CARD_USER_ID: userId,
        USER_CARD_STATUS: '1'  // 有效的卡项
      })
      .orderBy('USER_CARD_ADD_TIME', 'desc')
      .get()

    return res.data || []
  } catch (error) {
    console.error('获取我的卡项失败:', error)
    throw error
  }
}

/**
 * 获取用户卡项详情
 * @param {string} userCardId - 用户卡项 ID
 * @returns {Promise<Object>} 卡项详情
 */
export const getMyCardDetail = async (userCardId) => {
  try {
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

    // 统计总次数、剩余次数
    let totalCount = 0
    let remainCount = 0
    let expiredCount = 0

    const now = Date.now()

    cards.forEach(card => {
      totalCount += card.USER_CARD_TOTAL_CNT || 0

      // 检查是否过期
      if (card.USER_CARD_END && card.USER_CARD_END < now) {
        expiredCount++
      } else {
        remainCount += card.USER_CARD_CNT || 0
      }
    })

    return {
      totalCards: cards.length,      // 总卡项数
      totalCount,                     // 总次数
      remainCount,                    // 剩余次数
      expiredCount,                   // 过期卡项数
      activeCards: cards.length - expiredCount  // 有效卡项数
    }
  } catch (error) {
    console.error('获取卡项汇总失败:', error)
    throw error
  }
}

export default {
  getCardList,
  getHomeCardList,
  getCardDetail,
  getMyCards,
  getMyCardDetail,
  getMyCardRecords,
  getMyCardSummary
}
