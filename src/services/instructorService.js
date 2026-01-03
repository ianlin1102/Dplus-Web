import { callCloudRouteHTTP } from './httpApi'

/**
 * 获取导师列表
 * @returns {Promise} API响应
 */
export const getInstructorList = async () => {
  return await callCloudRouteHTTP('instructor/list', {})
}

/**
 * 获取导师详情
 * @param {string} id - 导师ID
 * @returns {Promise} API响应
 */
export const getInstructorDetail = async (id) => {
  return await callCloudRouteHTTP('instructor/detail', { id })
}
