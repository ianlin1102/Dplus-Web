/**
 * Admin 用户卡项管理服务
 * 调用云函数 Admin API 进行用户卡项的查询、充值、调整等操作
 */

import { callAdminAPI } from './adminService'

/**
 * 通过手机号搜索用户
 * @param {string} phone - 手机号（不含国家代码）
 * @param {string} countryCode - 国家代码（如 +1, +86）
 * @returns {Promise<Object>} 用户信息和卡项列表
 */
export const searchUserByPhone = async (phone, countryCode = '+1') => {
  return callAdminAPI('admin/user_card_search', { phone, countryCode })
}

/**
 * 通过卡项唯一识别码搜索
 * @param {string} uniqueId - 卡项识别码
 * @returns {Promise<Object>} 卡项信息和关联用户
 */
export const searchByUniqueId = async (uniqueId) => {
  return callAdminAPI('admin/user_card_search_by_id', { uniqueId })
}

/**
 * 获取用户卡项列表
 * @param {string} userId - 用户 ID
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise<Object>} 卡项列表
 */
export const getUserCardList = async (userId, page = 1, size = 20) => {
  return callAdminAPI('admin/user_card_list', { userId, page, size })
}

/**
 * 给用户添加/充值卡项
 * @param {Object} params - 充值参数
 * @param {string} params.userId - 用户 ID
 * @param {string} params.cardName - 卡项名称
 * @param {number} params.type - 卡项类型 (1=次数卡, 2=余额卡)
 * @param {number} params.times - 次数（次数卡）
 * @param {number} params.amount - 金额（余额卡）
 * @param {string} params.reason - 充值原因
 * @param {string} params.paymentMethod - 支付方式（可选）
 * @param {string} params.cardId - 关联的卡项商品 ID（可选）
 * @returns {Promise<Object>} 新创建的用户卡项
 */
export const addUserCard = async (params) => {
  return callAdminAPI('admin/user_card_add', params)
}

/**
 * 调整用户卡项（增加/扣减）
 * @param {Object} params - 调整参数
 * @param {string} params.userCardId - 用户卡项 ID
 * @param {number} params.changeTimes - 次数变动（正数增加，负数扣减）
 * @param {number} params.changeAmount - 金额变动（正数增加，负数扣减）
 * @param {string} params.reason - 调整原因
 * @param {string} params.relatedId - 关联 ID（可选，如预约 ID）
 * @returns {Promise<Object>} 调整结果
 */
export const adjustUserCard = async (params) => {
  return callAdminAPI('admin/user_card_adjust', params)
}

/**
 * 获取用户卡项使用记录
 * @param {string} userId - 用户 ID
 * @param {string} userCardId - 用户卡项 ID（可选，不传则查询用户所有记录）
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 * @returns {Promise<Object>} 使用记录列表
 */
export const getUserCardRecords = async (userId, userCardId = '', page = 1, size = 20) => {
  return callAdminAPI('admin/user_card_records', { userId, userCardId, page, size })
}

/**
 * 获取用户信息（包含卡项汇总）
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户信息和卡项统计
 */
export const getUserInfo = async (userId) => {
  return callAdminAPI('admin/user_card_info', { userId })
}

export default {
  searchUserByPhone,
  searchByUniqueId,
  getUserCardList,
  addUserCard,
  adjustUserCard,
  getUserCardRecords,
  getUserInfo
}
