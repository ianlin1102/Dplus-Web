/**
 * 取消政策展示组件
 */

import React from 'react';
import { AlertTriangle, Info, Clock, XCircle } from 'lucide-react';
import { formatCancelRule } from '../services/bookingService';
import './CancelPolicy.css';

const CancelPolicy = ({
  cancelSet,
  language = 'zh',
  compact = false
}) => {
  // 判断政策严格程度
  const isStrict = cancelSet?.isLimit && cancelSet?.days === -1;
  const hasLimit = cancelSet?.isLimit && cancelSet?.days !== -1;

  // 获取政策文本
  const policyText = formatCancelRule(cancelSet, language);

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
        {hasLimit && (
          <p className="policy-note">
            {language === 'zh'
              ? '超过时限取消将不予退还费用'
              : 'No refund for cancellations past the deadline'}
          </p>
        )}
        {isStrict && (
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
