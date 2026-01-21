/**
 * 取消政策展示组件
 * 显示取消规则和卡项返还说明
 */

import React from 'react';
import { Info, Clock, XCircle, RefreshCw } from 'lucide-react';
import { formatCancelRule } from '../services/bookingService';
import './CancelPolicy.css';

/**
 * 获取返还政策文本
 * @param {Object} cancelSet - 取消规则配置
 * @param {Object} costSet - 费用配置
 * @param {string} language - 语言
 */
const getRefundPolicyText = (cancelSet, costSet, language) => {
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

const CancelPolicy = ({
  cancelSet,
  costSet,  // 新增: 费用配置
  language = 'zh',
  compact = false
}) => {
  // 判断政策严格程度
  const isStrict = cancelSet?.isLimit && cancelSet?.days === -1;
  const hasLimit = cancelSet?.isLimit && cancelSet?.days !== -1;

  // 获取政策文本
  const policyText = formatCancelRule(cancelSet, language);

  // 获取返还政策文本
  const refundText = getRefundPolicyText(cancelSet, costSet, language);

  // 获取图标
  const getIcon = () => {
    if (isStrict) return <XCircle size={compact ? 16 : 20} />;
    if (hasLimit) return <Clock size={compact ? 16 : 20} />;
    return <Info size={compact ? 16 : 20} />;
  };

  // 获取样式类型
  const getType = () => {
    if (isStrict) return 'strict';
    if (hasLimit) return 'limited';
    return 'flexible';
  };

  if (compact) {
    return (
      <div className={`cancel-policy compact ${getType()}`}>
        {getIcon()}
        <span>{policyText}</span>
      </div>
    );
  }

  return (
    <div className={`cancel-policy ${getType()}`}>
      <div className="policy-header">
        <div className="policy-icon">
          {getIcon()}
        </div>
        <span className="policy-label">
          {language === 'zh' ? '取消政策' : 'Cancellation Policy'}
        </span>
      </div>
      <div className="policy-content">
        <p className="policy-text">{policyText}</p>

        {/* 返还机制说明 */}
        {refundText && (
          <div className="refund-policy">
            <RefreshCw size={14} />
            <span>{refundText}</span>
          </div>
        )}

        {hasLimit && !refundText && (
          <p className="policy-note">
            {language === 'zh'
              ? '超过时限取消将不予退还费用'
              : 'No refund for cancellations past the deadline'}
          </p>
        )}
        {isStrict && !refundText && (
          <p className="policy-warning">
            {language === 'zh'
              ? '请确认时间安排后再预约'
              : 'Please confirm your schedule before booking'}
          </p>
        )}
      </div>
    </div>
  );
};

export default CancelPolicy;
