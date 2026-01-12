/**
 * 预约协议勾选组件
 */

import React, { useState, useEffect } from 'react';
import { Check, X, FileText } from 'lucide-react';
import './BookingAgreement.css';

const BookingAgreement = ({
  agreed,
  onChange,
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

  // 渲染富文本内容
  const renderContent = (content) => {
    if (!content || content.length === 0) {
      return (
        <p className="terms-empty">
          {language === 'zh'
            ? '暂无预约须知'
            : 'No booking terms available'}
        </p>
      );
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
            {language === 'zh' ? '《预约须知》' : 'Booking Terms'}
          </button>
        </span>
      </label>

      {/* 预约须知弹窗 */}
      {showModal && (
        <div className="terms-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <div className="terms-modal-title">
                <FileText size={20} />
                <h3>{language === 'zh' ? '预约须知' : 'Booking Terms'}</h3>
              </div>
              <button
                className="terms-modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="terms-modal-body">
              {renderContent(termsContent)}
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
