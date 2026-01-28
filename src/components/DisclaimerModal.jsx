import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import './DisclaimerModal.css'

/**
 * 用户协议/免责声明弹窗组件
 */
const DisclaimerModal = ({ isOpen, onClose, onAgree }) => {
  const { language } = useLanguage()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    // 滚动到底部附近时，认为已阅读
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAgree = () => {
    onAgree?.()
    onClose()
  }

  const disclaimerContent = language === 'zh' ? {
    title: '卡项购买免责声明',
    subtitle: '请仔细阅读以下条款',
    sections: [
      {
        title: '一、购买须知',
        items: [
          '购买本卡项即表示您已充分了解并同意本免责声明的全部内容。',
          '卡项一经售出，概不退换。请在购买前仔细核对卡项类型、次数/金额、有效期等信息。',
          '卡项仅限本人使用，不得转让、出售或赠予他人（次数卡可一次性转让）。',
        ]
      },
      {
        title: '二、使用规则',
        items: [
          '卡项使用时需提前预约，预约时间以实际可预约时段为准。',
          '如需取消预约，请至少提前24小时通知，否则将扣除相应次数或金额。',
          '卡项在有效期内未使用完毕，过期自动作废，不予退款或延期。',
        ]
      },
      {
        title: '三、免责条款',
        items: [
          '因不可抗力（如自然灾害、政府行为等）导致无法提供服务的，本机构不承担任何责任。',
          '用户因个人原因无法使用卡项的（如身体状况、时间安排等），本机构不承担责任。',
          '本机构保留对卡项规则的最终解释权。',
        ]
      },
      {
        title: '四、退款政策',
        items: [
          '购买后7天内且未使用任何次数/金额，可申请全额退款。',
          '超过7天或已使用部分次数/金额的，不予退款。',
          '退款将在3-5个工作日内原路返回。',
        ]
      },
      {
        title: '五、其他说明',
        items: [
          '本免责声明的修改、更新及最终解释权归本机构所有。',
          '如对本声明有任何疑问，请联系客服咨询。',
        ]
      }
    ],
    scrollHint: '请滚动阅读完整内容',
    agreeButton: '我已阅读并同意',
    cancelButton: '取消',
  } : {
    title: 'Purchase Disclaimer',
    subtitle: 'Please read the following terms carefully',
    sections: [
      {
        title: '1. Purchase Notice',
        items: [
          'By purchasing this card, you acknowledge that you have fully understood and agreed to all contents of this disclaimer.',
          'All sales are final. Please verify card type, quantity/amount, and validity period before purchase.',
          'Cards are for personal use only and may not be transferred, sold, or gifted (Class Packs may be transferred once).',
        ]
      },
      {
        title: '2. Usage Rules',
        items: [
          'Advance booking is required. Booking availability is subject to actual available time slots.',
          'Cancellations must be made at least 24 hours in advance, otherwise the corresponding classes or amount will be deducted.',
          'Unused balance/classes will expire at the end of the validity period without refund or extension.',
        ]
      },
      {
        title: '3. Liability Disclaimer',
        items: [
          'We are not liable for service interruptions due to force majeure (natural disasters, government actions, etc.).',
          'We are not responsible for inability to use cards due to personal reasons (health conditions, scheduling, etc.).',
          'We reserve the right to final interpretation of card policies.',
        ]
      },
      {
        title: '4. Refund Policy',
        items: [
          'Full refund available within 7 days of purchase if no classes/credit have been used.',
          'No refunds after 7 days or if any classes/credit have been used.',
          'Refunds will be processed within 3-5 business days via original payment method.',
        ]
      },
      {
        title: '5. Other Notes',
        items: [
          'We reserve the right to modify, update, and interpret this disclaimer.',
          'Please contact customer service if you have any questions.',
        ]
      }
    ],
    scrollHint: 'Please scroll to read the full content',
    agreeButton: 'I have read and agree',
    cancelButton: 'Cancel',
  }

  return (
    <div className="disclaimer-overlay" onClick={onClose}>
      <div className="disclaimer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="disclaimer-header">
          <div className="header-content">
            <AlertCircle className="header-icon" size={24} />
            <div>
              <h2 className="header-title">{disclaimerContent.title}</h2>
              <p className="header-subtitle">{disclaimerContent.subtitle}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="disclaimer-content" onScroll={handleScroll}>
          {disclaimerContent.sections.map((section, idx) => (
            <div key={idx} className="disclaimer-section">
              <h3 className="section-title">{section.title}</h3>
              <ul className="section-list">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        {!hasScrolledToBottom && (
          <div className="scroll-hint">
            <span>{disclaimerContent.scrollHint}</span>
            <span className="scroll-arrow">↓</span>
          </div>
        )}

        {/* Footer */}
        <div className="disclaimer-footer">
          <button className="btn-cancel" onClick={onClose}>
            {disclaimerContent.cancelButton}
          </button>
          <button
            className={`btn-agree ${hasScrolledToBottom ? 'active' : ''}`}
            onClick={handleAgree}
            disabled={!hasScrolledToBottom}
          >
            <CheckCircle size={18} />
            {disclaimerContent.agreeButton}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DisclaimerModal
