import { useLanguage } from '../../i18n/LanguageContext'
import { useDataWithRetry } from '../../hooks/useDataWithRetry'
import { getCardListHTTP } from '../../services/httpApi'
import DataPlaceholder from '../../components/DataPlaceholder'
import './CardStore.css'

// Card types from smartbeauty: 次数卡 (Times Card) and 余额卡 (Balance Card)
const cards = {
  zh: [
    {
      id: 1,
      name: '10次舞蹈课程卡',
      type: '次数卡',
      price: 200,
      value: '10次',
      theme: 'cyan',
      features: ['任意舞种通用', '有效期1年', '适合经常上课的学员'],
      popular: false
    },
    {
      id: 2,
      name: '20次舞蹈课程卡',
      type: '次数卡',
      price: 380,
      value: '20次',
      theme: 'pink',
      features: ['任意舞种通用', '有效期1年', '可转让给好友', '赠送2次体验课'],
      popular: true
    },
    {
      id: 3,
      name: '$500充值卡',
      type: '余额卡',
      price: 500,
      value: '$500余额',
      theme: 'green',
      features: ['充值到账户余额', '可用于任意服务消费', '永久有效', '消费享9折优惠'],
      popular: false
    },
    {
      id: 4,
      name: '$1000储值卡',
      type: '余额卡',
      price: 1000,
      value: '$1000余额',
      theme: 'cyan',
      features: ['充值到账户余额', '可用于任意服务消费', '永久有效', '消费享85折优惠', '赠送$100'],
      popular: false
    }
  ],
  en: [
    {
      id: 1,
      name: '10 Class Pack',
      type: 'Class Pack',
      price: 200,
      value: '10 classes',
      theme: 'cyan',
      features: ['Valid for all dance styles', '1 year validity', 'Great for regular students'],
      popular: false
    },
    {
      id: 2,
      name: '20 Class Pack',
      type: 'Class Pack',
      price: 380,
      value: '20 classes',
      theme: 'pink',
      features: ['Valid for all dance styles', '1 year validity', 'Transferable', '2 free trial classes'],
      popular: true
    },
    {
      id: 3,
      name: '$500 Credit Card',
      type: 'Credit Card',
      price: 500,
      value: '$500 balance',
      theme: 'green',
      features: ['Add to account balance', 'Use for any service', 'Never expires', '10% discount on all purchases'],
      popular: false
    },
    {
      id: 4,
      name: '$1000 Credit Card',
      type: 'Credit Card',
      price: 1000,
      value: '$1000 balance',
      theme: 'cyan',
      features: ['Add to account balance', 'Use for any service', 'Never expires', '15% discount on all purchases', 'Bonus $100'],
      popular: false
    }
  ]
}

function CardStore() {
  const { t, language } = useLanguage()

  // 使用自动重试 Hook 加载卡项数据
  const {
    data: apiCards,
    loading: cardsLoading,
    hasData: hasCards,
    retryCount: cardRetryCount
  } = useDataWithRetry(
    async () => {
      const result = await getCardListHTTP(20, 1)
      if (result.code === 200 && result.data) {
        return result.data.list || []
      }
      return []
    },
    {
      cacheKey: 'card_list',
      cacheTTL: 24 * 60 * 60 * 1000, // 24小时
      retryInterval: 60000, // 1分钟
      enableRetry: true
    }
  )

  // 如果 API 返回数据，使用 API 数据；否则使用静态数据作为后备
  const displayCards = hasCards && apiCards.length > 0 ? apiCards : cards[language]

  return (
    <div className="store-page">
      <div className="bg-grid-pattern grid-overlay" />

      <div className="store-container">
        <h1 className="store-title">{t('store.title')}</h1>
        <p className="store-subtitle">{t('store.subtitle')}</p>

        {/* Card Type Legend */}
        <div className="card-types">
          <div className="type-badge cyan">
            <span className="type-dot"></span>
            {language === 'zh' ? '次数卡 - 按次扣减' : 'Class Pack - Per class'}
          </div>
          <div className="type-badge green">
            <span className="type-dot"></span>
            {language === 'zh' ? '余额卡 - 按金额扣减' : 'Credit Card - Per dollar'}
          </div>
        </div>

        {/* 加载状态显示 Placeholder */}
        {cardsLoading && !hasCards ? (
          <DataPlaceholder
            type="card"
            count={4}
            message={language === 'zh' ? '正在加载卡项信息...' : 'Loading card information...'}
            retryCount={cardRetryCount}
          />
        ) : (
          <div className="cards-grid">
            {displayCards.map((card, index) => {
            // 处理 API 数据和静态数据的不同结构
            const cardId = card._id || card.id || index
            const cardName = card.CARD_TITLE || card.name || ''
            const cardType = card.CARD_TYPE === 1 ? (language === 'zh' ? '次数卡' : 'Class Pack') :
                             card.CARD_TYPE === 2 ? (language === 'zh' ? '余额卡' : 'Credit Card') :
                             (card.type || '')
            const cardPrice = card.CARD_PRICE || card.price || 0
            const cardValue = card.CARD_CNT ? `${card.CARD_CNT}${language === 'zh' ? '次' : ' classes'}` :
                              card.CARD_BALANCE ? `$${card.CARD_BALANCE}${language === 'zh' ? '余额' : ' balance'}` :
                              (card.value || '')

            // 默认主题颜色
            const cardTheme = card.theme || (index % 3 === 0 ? 'cyan' : index % 3 === 1 ? 'pink' : 'green')
            const neonClass = `neon-border-${cardTheme}`
            const titleColor = cardTheme === 'cyan' ? 'text-cyan' : cardTheme === 'pink' ? 'text-pink' : 'text-green'

            // 特性列表
            const cardFeatures = card.features || []
            const isPopular = card.popular || card.CARD_HOME > 0

            return (
              <div key={cardId} className={`plan-card ${neonClass} ${isPopular ? 'popular' : ''}`}>
                {isPopular && <span className="popular-badge">{language === 'zh' ? '热门' : 'Popular'}</span>}

                <span className={`card-type-label ${cardTheme}`}>{cardType}</span>

                <h3 className={`plan-name ${titleColor}`}>
                  {cardName}
                </h3>

                <div className="plan-price">
                  <span className="price-currency">$</span>
                  {cardPrice}
                </div>
                <p className="plan-count">/ {cardValue}</p>

                {cardFeatures.length > 0 && (
                  <ul className="plan-features">
                    {cardFeatures.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                )}

                <button className={`plan-button btn-${cardTheme}`}>
                  {t('store.buy')}
                </button>
              </div>
            )
          })}
          </div>
        )}

        {/* Payment Info */}
        <section className="payment-section">
          <h2 className="section-title">{t('store.paymentTitle')}</h2>
          <div className="payment-info">
            <div className="payment-method">
              <h4>Zelle {language === 'zh' ? '转账' : 'Transfer'}</h4>
              <p>{language === 'zh' ? '转账后请截图发送至微信，我们会在24小时内为您充值' : 'After transfer, send screenshot to WeChat. We will credit your account within 24 hours.'}</p>
            </div>
            <div className="payment-method">
              <h4>{language === 'zh' ? '现场支付' : 'In-Person Payment'}</h4>
              <p>{language === 'zh' ? '欢迎到店后使用现金或刷卡支付' : 'Cash or card payment welcome at our studio'}</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="section-title">{language === 'zh' ? '常见问题' : 'FAQ'}</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>{language === 'zh' ? '次数卡和余额卡有什么区别?' : "What's the difference between Class Pack and Credit Card?"}</h4>
              <p>{language === 'zh' ? '次数卡按次数扣减，适合固定服务；余额卡按金额扣减，使用更灵活。' : 'Class Packs deduct per class, great for regular classes. Credit Cards deduct by amount, more flexible for various services.'}</p>
            </div>
            <div className="faq-item">
              <h4>{language === 'zh' ? '卡项可以转让吗?' : 'Can I transfer my card?'}</h4>
              <p>{language === 'zh' ? '次数卡支持一次性转让给他人，余额卡不支持转让。' : 'Class Packs can be transferred once. Credit Cards are non-transferable.'}</p>
            </div>
            <div className="faq-item">
              <h4>{language === 'zh' ? '可以退款吗?' : 'Can I get a refund?'}</h4>
              <p>{language === 'zh' ? '购买后7天内且未使用可申请全额退款。' : 'Full refund available within 7 days if unused.'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CardStore
