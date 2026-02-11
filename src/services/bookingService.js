/**
 * 预约服务层
 * 封装预约相关的 API 调用和业务逻辑
 */

import { callCloudRouteHTTP } from './httpApi';
import { callCloudRoute } from './api';

/**
 * 预约前获取详情（表单、取消规则、费用配置）
 * 通过云函数 API 获取完整 meet 数据（含 MEET_COST_SET）
 * @param {string} meetId - 预约项目 ID
 * @param {string} timeMark - 时间段标记
 */
export const getMeetDetailForJoin = async (meetId, timeMark) => {
  try {
    console.log('[getMeetDetailForJoin] 调用云函数, meetId:', meetId, 'timeMark:', timeMark);

    // 使用云函数 API（比 CloudBase SDK 匿名查询更可靠）
    const result = await callCloudRouteHTTP('meet/detail_for_join', { meetId, timeMark });

    console.log('[getMeetDetailForJoin] 云函数返回:', result);

    if (result.code === 200 && result.data) {
      const meet = result.data;
      // 云函数返回格式包含 MEET_DAYS_SET、MEET_FORM_SET、MEET_COST_SET 等
      // 需要从 MEET_DAYS_SET 中提取时段信息
      let day = null;
      let timeStart = null;
      let timeEnd = null;
      let limit = null;
      let stat = null;

      if (meet.MEET_DAYS_SET && Array.isArray(meet.MEET_DAYS_SET)) {
        for (const daySet of meet.MEET_DAYS_SET) {
          if (daySet.times && Array.isArray(daySet.times)) {
            const timeSlot = daySet.times.find(t => t.mark === timeMark);
            if (timeSlot) {
              day = daySet.day;
              timeStart = timeSlot.start;
              timeEnd = timeSlot.end;
              limit = timeSlot.limit;
              stat = timeSlot.stat;
              break;
            }
          }
        }
      }

      const data = {
        _id: meet._id,
        MEET_TITLE: meet.MEET_TITLE,
        MEET_TYPE_ID: meet.MEET_TYPE_ID,
        MEET_TYPE_NAME: meet.MEET_TYPE_NAME,
        MEET_INSTRUCTOR_ID: meet.MEET_INSTRUCTOR_ID,
        MEET_INSTRUCTOR_NAME: meet.MEET_INSTRUCTOR_NAME,
        MEET_INSTRUCTOR_PIC: meet.MEET_INSTRUCTOR_PIC,
        MEET_COURSE_INFO: meet.MEET_COURSE_INFO,
        MEET_CONTENT: meet.MEET_CONTENT,
        MEET_FORM_SET: meet.MEET_FORM_SET,
        MEET_COST_SET: meet.MEET_COST_SET,
        MEET_CANCEL_SET: meet.MEET_CANCEL_SET,
        MEET_IS_SHOW_LIMIT: meet.MEET_IS_SHOW_LIMIT,
        dayDesc: meet.dayDesc,
        myForms: meet.myForms,
        day,
        timeStart,
        timeEnd,
        limit,
        stat
      };

      return { code: 200, data };
    }

    return { code: result.code || 500, msg: result.msg || '获取预约详情失败' };
  } catch (error) {
    console.error('[getMeetDetailForJoin] 失败:', error);
    return { code: 500, msg: error.message || '获取预约详情失败' };
  }
};

/**
 * 预约前检测（验证时段、人数、截止时间）
 * 调用云函数进行检测，使用服务器时间（UTC+8）
 * 与小程序端 cloudHelper.callCloudSumbit('meet/before_join') 保持一致
 * @param {string} meetId - 预约项目 ID
 * @param {string} timeMark - 时间段标记
 * @param {string} day - 日期 (YYYY-MM-DD) - 保留参数兼容性
 */
export const beforeJoin = async (meetId, timeMark, day = null) => {
  try {
    // 调用云函数进行预约前检测
    // 与小程序端保持一致：cloudHelper.callCloudSumbit('meet/before_join', { meetId, timeMark })
    const result = await callCloudRoute('meet/before_join', {
      meetId,
      timeMark
    });

    // 云函数成功返回 code: 200
    return { code: 200, msg: '可以预约' };
  } catch (error) {
    console.error('预约前检测失败:', error);
    // 云函数会抛出具体的错误信息
    return {
      code: 500,
      msg: error.message || '检测失败'
    };
  }
};

/**
 * 提交预约
 * @param {string} meetId - 预约项目 ID
 * @param {string} timeMark - 时间段标记
 * @param {Array} forms - 表单数据
 * @param {string} cardId - 卡项 ID（可选）
 */
export const submitJoin = async (meetId, timeMark, forms = [], cardId = '') => {
  try {
    const result = await callCloudRouteHTTP('meet/join', {
      meetId,
      timeMark,
      forms,
      cardId
    });
    return result;
  } catch (error) {
    console.error('提交预约失败:', error);
    throw error;
  }
};

/**
 * 获取我的预约列表
 * @param {Object} params - 查询参数
 */
export const getMyJoinList = async (params = {}) => {
  try {
    const result = await callCloudRouteHTTP('my/my_join_list', {
      page: 1,
      size: 20,
      sortType: 'timedesc',
      ...params
    });
    return result;
  } catch (error) {
    console.error('获取预约列表失败:', error);
    throw error;
  }
};

/**
 * 获取预约详情
 * @param {string} joinId - 预约记录 ID
 */
export const getMyJoinDetail = async (joinId) => {
  try {
    const result = await callCloudRouteHTTP('my/my_join_detail', { joinId });
    return result;
  } catch (error) {
    console.error('获取预约详情失败:', error);
    throw error;
  }
};

/**
 * 取消预约
 * @param {string} joinId - 预约记录 ID
 */
export const cancelMyJoin = async (joinId) => {
  try {
    const result = await callCloudRouteHTTP('my/my_join_cancel', { joinId });
    return result;
  } catch (error) {
    console.error('取消预约失败:', error);
    throw error;
  }
};

/**
 * 获取可用于预约的卡项（过滤过期和余额不足）
 * 通过云函数 API 获取用户卡项列表
 * @param {Object} costSet - 费用配置
 */
export const getAvailableCardsForBooking = async (costSet) => {
  try {
    console.log('[getAvailableCardsForBooking] 通过云函数获取卡项');

    const result = await callCloudRouteHTTP('my/my_card_list', {});

    console.log('[getAvailableCardsForBooking] 云函数返回:', result);

    if (result.code !== 200 || !result.data) {
      console.log('[getAvailableCardsForBooking] 获取卡项失败:', result.msg);
      return [];
    }

    const cards = result.data.list || result.data || [];
    if (!Array.isArray(cards) || cards.length === 0) {
      return [];
    }

    const now = Date.now();

    // 过滤可用卡项
    return cards.filter(card => {
      // 过滤过期卡项
      const expireTime = card.USER_CARD_EXPIRE_TIME;
      if (expireTime && expireTime > 0 && expireTime < now) {
        return false;
      }

      // 根据费用类型过滤
      if (!costSet || !costSet.isEnabled || costSet.costType === 'free') {
        return true;
      }

      // 判断卡项类型：1=次数卡, 2=余额卡
      const cardType = card.USER_CARD_TYPE;
      const isTimesCard = cardType === 1;
      const isBalanceCard = cardType === 2;

      // 次数卡剩余次数
      const remainTimes = card.USER_CARD_REMAIN_TIMES || 0;
      // 余额卡剩余余额
      const remainBalance = card.USER_CARD_REMAIN_AMOUNT || 0;

      if (costSet.costType === 'times') {
        return isTimesCard && remainTimes >= (costSet.timesCost || 1);
      } else if (costSet.costType === 'balance') {
        return isBalanceCard && remainBalance >= (costSet.balanceCost || 0);
      } else if (costSet.costType === 'both') {
        return (isTimesCard && remainTimes >= (costSet.timesCost || 1)) ||
               (isBalanceCard && remainBalance >= (costSet.balanceCost || 0));
      }

      return true;
    });
  } catch (error) {
    console.error('[getAvailableCardsForBooking] 失败:', error);
    return [];
  }
};

/**
 * 格式化取消规则描述
 * @param {Object} cancelSet - 取消规则配置
 * @param {string} language - 语言 ('zh' | 'en')
 */
export const formatCancelRule = (cancelSet, language = 'zh') => {
  if (!cancelSet || !cancelSet.isLimit) {
    return language === 'zh' ? '可随时取消' : 'Can cancel anytime';
  }

  if (cancelSet.days === -1) {
    return language === 'zh' ? '预约后不可取消' : 'Cannot cancel after booking';
  }

  const parts = [];
  if (cancelSet.days > 0) {
    parts.push(`${cancelSet.days}${language === 'zh' ? '天' : ' day(s)'}`);
  }
  if (cancelSet.hours > 0) {
    parts.push(`${cancelSet.hours}${language === 'zh' ? '小时' : ' hour(s)'}`);
  }
  if (cancelSet.minutes > 0) {
    parts.push(`${cancelSet.minutes}${language === 'zh' ? '分钟' : ' min'}`);
  }

  if (parts.length === 0) {
    return language === 'zh' ? '可随时取消' : 'Can cancel anytime';
  }

  return language === 'zh'
    ? `开课前 ${parts.join('')} 内不可取消`
    : `Cannot cancel within ${parts.join('')} before class`;
};

/**
 * 检查预约是否可取消
 * @param {Object} join - 预约记录
 * @param {Object} cancelSet - 取消规则配置（可选，如果 join 中没有）
 */
export const canCancelBooking = (join, cancelSet = null) => {
  // 非成功状态不可取消
  if (join.JOIN_STATUS !== 1) {
    return { canCancel: false, reason: 'not_success' };
  }

  // 已签到不可取消
  if (join.JOIN_IS_CHECKIN === 1) {
    return { canCancel: false, reason: 'already_checkin' };
  }

  // 计算开始时间
  const startTimeStr = `${join.JOIN_MEET_DAY} ${join.JOIN_MEET_TIME_START}:00`;
  const startTime = new Date(startTimeStr.replace(/-/g, '/')).getTime();
  const now = Date.now();

  // 已开始不可取消
  if (now > startTime) {
    return { canCancel: false, reason: 'already_started' };
  }

  // 获取取消规则
  const rules = cancelSet || join.cancelSet || join.meet?.MEET_CANCEL_SET || {};

  // 没有限制，可以取消
  if (!rules.isLimit) {
    return { canCancel: true };
  }

  // 不可取消
  if (rules.days === -1) {
    return { canCancel: false, reason: 'no_cancel_allowed' };
  }

  // 计算限制时间（毫秒）
  let limitMs = 0;
  if (rules.days) limitMs += rules.days * 24 * 3600 * 1000;
  if (rules.hours) limitMs += rules.hours * 3600 * 1000;
  if (rules.minutes) limitMs += rules.minutes * 60 * 1000;

  // 检查是否在可取消时间内
  const limitTime = startTime - limitMs;
  if (now >= limitTime) {
    return { canCancel: false, reason: 'exceed_limit_time' };
  }

  return { canCancel: true };
};

/**
 * 格式化预约状态
 * @param {number} status - 预约状态码
 * @param {string} language - 语言
 */
export const formatJoinStatus = (status, language = 'zh') => {
  const statusMap = {
    0: { zh: '待审核', en: 'Pending' },
    1: { zh: '预约成功', en: 'Confirmed' },
    10: { zh: '已取消', en: 'Cancelled' },
    99: { zh: '系统取消', en: 'System Cancelled' }
  };

  const s = statusMap[status] || { zh: '未知', en: 'Unknown' };
  return language === 'zh' ? s.zh : s.en;
};

/**
 * 计算课程时长（分钟）
 * @param {string} startTime - 开始时间 (HH:MM)
 * @param {string} endTime - 结束时间 (HH:MM)
 */
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  return (endH * 60 + endM) - (startH * 60 + startM);
};

/**
 * 格式化时长显示
 * @param {number} minutes - 分钟数
 * @param {string} language - 语言
 */
export const formatDuration = (minutes, language = 'zh') => {
  if (minutes <= 0) return '';

  if (minutes < 60) {
    return language === 'zh' ? `${minutes}分钟` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return language === 'zh' ? `${hours}小时` : `${hours} hr`;
  }

  return language === 'zh'
    ? `${hours}小时${mins}分钟`
    : `${hours}h ${mins}m`;
};

/**
 * 格式化卡项扣费信息
 * @param {Object} deduct - 扣费记录 (JOIN_CARD_DEDUCT)
 * @param {string} language - 语言
 */
export const formatDeductInfo = (deduct, language = 'zh') => {
  if (!deduct) return null;

  if (deduct.cardType === 'times') {
    return language === 'zh'
      ? `${deduct.deductAmount} 次`
      : `${deduct.deductAmount} class(es)`;
  }

  return language === 'zh'
    ? `¥${deduct.deductAmount}`
    : `¥${deduct.deductAmount}`;
};

/**
 * 格式化返还政策文本
 * @param {Object} cancelSet - 取消规则配置
 * @param {Object} costSet - 费用配置
 * @param {string} language - 语言
 */
export const formatRefundPolicy = (cancelSet, costSet, language = 'zh') => {
  // 如果不需要扣费，不显示返还说明
  if (!costSet?.isEnabled || costSet?.costType === 'free') {
    return null;
  }

  // 获取扣费类型描述
  const getCostTypeDesc = () => {
    if (costSet.costType === 'times') {
      return language === 'zh' ? '课程次数' : 'class credits';
    } else if (costSet.costType === 'balance') {
      return language === 'zh' ? '卡项余额' : 'card balance';
    } else {
      return language === 'zh' ? '卡项次数/余额' : 'class credits/balance';
    }
  };

  const costDesc = getCostTypeDesc();

  // 不可取消
  if (cancelSet?.isLimit && cancelSet?.days === -1) {
    return language === 'zh'
      ? `预约后不可取消，${costDesc}不予退还`
      : `Cannot cancel after booking, ${costDesc} will not be refunded`;
  }

  // 有时间限制
  if (cancelSet?.isLimit) {
    return language === 'zh'
      ? `在规定时间内取消可退还${costDesc}，超过时限不予退还`
      : `${costDesc} will be refunded if cancelled within the time limit, no refund past deadline`;
  }

  // 可随时取消
  return language === 'zh'
    ? `取消预约后，${costDesc}将自动退还`
    : `${costDesc} will be automatically refunded upon cancellation`;
};

/**
 * 检查预约是否可以获得退还
 * @param {Object} booking - 预约记录
 */
export const canGetRefund = (booking) => {
  // 没有扣费记录
  if (!booking.JOIN_CARD_DEDUCT) return false;
  // 已经退还过
  if (booking.JOIN_CARD_DEDUCT.refunded) return false;
  // 已签到
  if (booking.JOIN_IS_CHECKIN === 1) return false;
  // 非成功状态
  if (booking.JOIN_STATUS !== 1) return false;

  return true;
};

/**
 * 获取某个时段的已预约人员名单
 * @param {string} meetId - 预约项目 ID
 * @param {string} timeMark - 时间段标记
 * @returns {Promise<Object>} - { code, data: { list: [...], count } }
 */
export const getSlotBookings = async (meetId, timeMark) => {
  try {
    const result = await callCloudRouteHTTP('meet/get_slot_bookings', {
      meetId,
      timeMark
    });
    return result;
  } catch (error) {
    console.error('获取已预约名单失败:', error);
    return { code: 500, msg: error.message || '获取已预约名单失败' };
  }
};

export default {
  getMeetDetailForJoin,
  beforeJoin,
  submitJoin,
  getMyJoinList,
  getMyJoinDetail,
  cancelMyJoin,
  getAvailableCardsForBooking,
  getSlotBookings,
  formatCancelRule,
  canCancelBooking,
  formatJoinStatus,
  calculateDuration,
  formatDuration,
  formatDeductInfo,
  formatRefundPolicy,
  canGetRefund
};
