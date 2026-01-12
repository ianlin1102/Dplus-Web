import { useEffect } from 'react'
import { X, Smartphone, Loader2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import './PurchaseModal.css'

/**
 * 购买确认弹窗组件
 * 仅支持 Zelle 转账支付
 */
const PurchaseModal = ({ isOpen, onClose, card, onConfirm, isPurchasing }) => {
  const { language } = useLanguage()

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      // 保存原始 overflow 样式
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen || !card) return null

  // 处理不同数据结构
  const cardName = card.CARD_TITLE || card.name || ''
  const cardPrice = card.CARD_PRICE || card.price || 0
  const cardType = card.CARD_TYPE === 1 ? (language === 'zh' ? '次数卡' : 'Class Pack') :
                   card.CARD_TYPE === 2 ? (language === 'zh' ? '余额卡' : 'Credit Card') :
                   (card.type || '')
  const cardValue = card.CARD_CNT ? `${card.CARD_CNT}${language === 'zh' ? '次' : ' classes'}` :
                    card.CARD_BALANCE ? `$${card.CARD_BALANCE}${language === 'zh' ? '余额' : ' balance'}` :
                    (card.value || '')

  const handleConfirm = () => {
    // 直接使用 zelle 支付方式
    onConfirm?.('zelle')
  }

  const texts = language === 'zh' ? {
    title: '确认购买',
    cardInfo: '卡项信息',
    paymentMethod: '支付方式',
    zelleTitle: 'Zelle 转账',
    zelleDesc: '转账后请上传截图凭证',
    zelleAccount: 'Zelle 收款账号',
    total: '合计',
    confirmButton: '确认购买',
    purchasing: '处理中...',
    cancel: '取消',
    note: '确认后将跳转到上传凭证页面',
  } : {
    title: 'Confirm Purchase',
    cardInfo: 'Card Information',
    paymentMethod: 'Payment Method',
    zelleTitle: 'Zelle Transfer',
    zelleDesc: 'Please upload screenshot after transfer',
    zelleAccount: 'Zelle Account',
    total: 'Total',
    confirmButton: 'Confirm Purchase',
    purchasing: 'Processing...',
    cancel: 'Cancel',
    note: 'You will be prompted to upload proof after confirming',
  }

  return (
    <div className="purchase-overlay" onClick={onClose}>
      <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="purchase-header">
          <h2>{texts.title}</h2>
          <button className="close-btn" onClick={onClose} disabled={isPurchasing}>
            <X size={20} />
          </button>
        </div>

        {/* Card Info */}
        <div className="purchase-card-info">
          <h3>{texts.cardInfo}</h3>
          <div className="card-summary">
            <div className="card-name">{cardName}</div>
            <div className="card-details">
              <span className="card-type">{cardType}</span>
              <span className="card-value">{cardValue}</span>
            </div>
          </div>
        </div>

        {/* Zelle Payment Info */}
        <div className="payment-methods">
          <h3>{texts.paymentMethod}</h3>
          <div className="zelle-payment-box">
            <div className="zelle-header">
              <div className="zelle-icon">
                <Smartphone size={24} />
              </div>
              <div className="zelle-info">
                <span className="zelle-title">{texts.zelleTitle}</span>
                <span className="zelle-desc">{texts.zelleDesc}</span>
              </div>
            </div>
            <div className="zelle-account">
              <span className="account-label">{texts.zelleAccount}:</span>
              <span className="account-value">smartbeauty@example.com</span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="purchase-total">
          <span>{texts.total}</span>
          <span className="total-price">${cardPrice}</span>
        </div>

        {/* Note */}
        <div className="purchase-note">
          {texts.note}
        </div>

        {/* Footer */}
        <div className="purchase-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isPurchasing}>
            {texts.cancel}
          </button>
          <button
            className="btn-confirm active"
            onClick={handleConfirm}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <>
                <Loader2 size={18} className="spin" />
                {texts.purchasing}
              </>
            ) : (
              texts.confirmButton
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PurchaseModal
