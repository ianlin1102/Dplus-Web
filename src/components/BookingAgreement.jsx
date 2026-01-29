/**
 * 预约协议勾选组件
 * 包含：
 * 1. 预约须知（根据取消政策动态生成）
 * 2. 服务条款弹窗
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, FileText, AlertTriangle, Info } from 'lucide-react';
import './BookingAgreement.css';

const BookingAgreement = ({
  agreed,
  onChange,
  cancelSet = {},  // 取消规则配置
  termsContent = [], // 来自 MEET_CONTENT 的富文本
  language = 'zh'
}) => {
  const [showModal, setShowModal] = useState(false);

  // 打开/关闭模态框时控制 body 滚动
  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal]);

  // 根据取消规则生成预约须知文本（与小程序保持一致）
  const bookingNotice = useMemo(() => {
    if (cancelSet.isLimit) {
      if (cancelSet.days === -1) {
        return language === 'zh'
          ? '本预约提交后不可取消，请您谨慎选择预约时间。如因个人原因未能按时参加，将无法获得任何补偿。'
          : 'This booking cannot be cancelled once submitted. Please choose your time carefully. No compensation will be provided for no-shows due to personal reasons.';
      } else {
        // 有时间限制
        const timeParts = [];
        if (cancelSet.days > 0) {
          timeParts.push(language === 'zh' ? `${cancelSet.days}天` : `${cancelSet.days} day(s)`);
        }
        if (cancelSet.hours > 0) {
          timeParts.push(language === 'zh' ? `${cancelSet.hours}小时` : `${cancelSet.hours} hour(s)`);
        }
        if (cancelSet.minutes > 0) {
          timeParts.push(language === 'zh' ? `${cancelSet.minutes}分钟` : `${cancelSet.minutes} minute(s)`);
        }
        const timeDesc = timeParts.join(language === 'zh' ? '' : ' ');

        return language === 'zh'
          ? `本预约需在开始前${timeDesc}取消，超过该时间将无法取消。请您合理安排时间，如因个人原因超时未取消，将无法获得任何补偿。`
          : `This booking must be cancelled at least ${timeDesc} before the start time. Late cancellations are not permitted. No compensation will be provided for late cancellations due to personal reasons.`;
      }
    } else {
      return language === 'zh'
        ? '本预约可在开始前随时取消。请您按时参加预约，如需取消请提前操作。'
        : 'This booking can be cancelled anytime before it starts. Please attend on time or cancel in advance if needed.';
    }
  }, [cancelSet, language]);

  // 通用条款文本
  const generalTerms = useMemo(() => {
    if (language === 'zh') {
      return [
        '请准时到达预约地点，迟到可能影响您的服务体验。',
        '如有任何特殊需求或健康状况，请提前告知工作人员。',
        '请妥善保管个人物品，贵重物品建议随身携带。',
        '场地内请遵守相关规定，保持环境整洁。',
        '未成年人参与活动需监护人陪同或签署同意书。'
      ];
    }
    return [
      'Please arrive on time. Being late may affect your service experience.',
      'Inform staff in advance of any special needs or health conditions.',
      'Please take care of personal belongings. Keep valuables with you.',
      'Follow venue rules and help maintain a clean environment.',
      'Minors require guardian accompaniment or signed consent.'
    ];
  }, [language]);

  // 渲染富文本内容（课程专属须知）
  const renderContent = (content) => {
    if (!content || content.length === 0) {
      return null;
    }

    return content.map((item, idx) => {
      if (item.type === 'text') {
        return <p key={idx} className="terms-text">{item.val}</p>;
      }
      if (item.type === 'img' || item.type === 'image') {
        return (
          <div key={idx} className="terms-image">
            <img src={item.val} alt="" />
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="booking-agreement">
      {/* 预约须知 - 直接显示 */}
      <div className="booking-notice">
        <div className="notice-header">
          <AlertTriangle size={18} className="notice-icon" />
          <h4>{language === 'zh' ? '预约须知' : 'Booking Notice'}</h4>
        </div>
        <div className="notice-content">
          <p className="notice-main-text">{bookingNotice}</p>
        </div>
      </div>

      {/* 协议勾选 */}
      <div className="agreement-row">
        <label className="agreement-checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className={`checkmark ${agreed ? 'checked' : ''}`}>
            {agreed && <Check size={14} />}
          </span>
          <span className="agreement-text">
            {language === 'zh' ? '我已阅读并同意' : 'I have read and agree to '}
            <button
              type="button"
              className="terms-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              {language === 'zh' ? '《服务条款》' : 'Terms of Service'}
            </button>
          </span>
        </label>
      </div>

      {/* 服务条款弹窗 */}
      {showModal && (
        <div className="terms-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <div className="terms-modal-title">
                <FileText size={20} />
                <h3>{language === 'zh' ? '服务条款' : 'Terms of Service'}</h3>
              </div>
              <button
                className="terms-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="terms-modal-body">
              {/* 预约须知部分 */}
              <div className="terms-section">
                <h4 className="terms-section-title">
                  <AlertTriangle size={16} />
                  {language === 'zh' ? '预约须知' : 'Booking Notice'}
                </h4>
                <p className="terms-highlight">{bookingNotice}</p>
              </div>

              {/* 通用条款部分 */}
              <div className="terms-section">
                <h4 className="terms-section-title">
                  <Info size={16} />
                  {language === 'zh' ? '服务条款' : 'Terms & Conditions'}
                </h4>
                <ul className="terms-list">
                  {generalTerms.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ul>
              </div>

              {/* 课程专属须知（如果有） */}
              {termsContent && termsContent.length > 0 && (
                <div className="terms-section">
                  <h4 className="terms-section-title">
                    <FileText size={16} />
                    {language === 'zh' ? '课程须知' : 'Course Notice'}
                  </h4>
                  {renderContent(termsContent)}
                </div>
              )}
            </div>

            <div className="terms-modal-footer">
              <button
                className="terms-agree-btn"
                onClick={() => {
                  onChange(true);
                  setShowModal(false);
                }}
              >
                {language === 'zh' ? '我已阅读并同意' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingAgreement;
