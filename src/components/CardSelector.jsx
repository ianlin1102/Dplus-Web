/**
 * 卡项选择器组件
 * 用于预约时选择支付卡项
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, CreditCard, Coins, AlertCircle } from 'lucide-react';
import './CardSelector.css';

const CardSelector = ({
  cards = [],
  selectedId,
  onSelect,
  costSet = {},
  language = 'zh'
}) => {
  // 无可用卡项
  if (!cards || cards.length === 0) {
    return (
      <div className="card-selector empty">
        <div className="empty-icon">
          <AlertCircle size={32} />
        </div>
        <p className="empty-text">
          {language === 'zh'
            ? '暂无可用卡项，请先购买卡项'
            : 'No available cards. Please purchase first.'}
        </p>
        <Link to="/store" className="buy-card-link">
          {language === 'zh' ? '前往购买' : 'Go to Store'}
        </Link>
      </div>
    );
  }

  // 费用提示
  const getCostHint = () => {
    if (!costSet.isEnabled || costSet.costType === 'free') {
      return language === 'zh' ? '本次预约免费' : 'Free booking';
    }

    if (costSet.costType === 'times') {
      return language === 'zh'
        ? `需消耗 ${costSet.timesCost} 次`
        : `Requires ${costSet.timesCost} class(es)`;
    }

    if (costSet.costType === 'balance') {
      return language === 'zh'
        ? `需消耗 ¥${costSet.balanceCost}`
        : `Requires ¥${costSet.balanceCost}`;
    }

    // both
    return language === 'zh'
      ? `需消耗 ${costSet.timesCost} 次 或 ¥${costSet.balanceCost}`
      : `Requires ${costSet.timesCost} class(es) or ¥${costSet.balanceCost}`;
  };

  // 获取卡项显示信息
  const getCardInfo = (card) => {
    // USER_CARD_TYPE: 1=次数卡, 2=余额卡
    // 兼容多种字段命名（USER_CARD_CNT 或 USER_CARD_REMAIN_TIMES）
    const isTimesCard = card.USER_CARD_TYPE === 1 || card.USER_CARD_CNT !== undefined;
    const cardName = card.USER_CARD_TITLE || card.USER_CARD_NAME || card.USER_CARD_CARD_NAME ||
      (language === 'zh' ? (isTimesCard ? '次数卡' : '余额卡') : (isTimesCard ? 'Class Pack' : 'Credit Card'));

    let balance, deduct, unit;

    if (isTimesCard) {
      balance = card.USER_CARD_CNT || card.USER_CARD_REMAIN_TIMES || 0;
      deduct = costSet.timesCost || 1;
      unit = language === 'zh' ? '次' : ' class(es)';
    } else {
      balance = card.USER_CARD_BALANCE || card.USER_CARD_REMAIN_AMOUNT || 0;
      deduct = costSet.balanceCost || 0;
      unit = '';
    }

    return { cardName, balance, deduct, unit, isTimesCard };
  };

  // 检查卡项是否过期
  const isExpired = (card) => {
    const expireTime = card.USER_CARD_EXPIRE_TIME || card.USER_CARD_END;
    if (!expireTime) return false;
    return expireTime < Date.now();
  };

  // 获取过期时间
  const getExpireTime = (card) => {
    return card.USER_CARD_EXPIRE_TIME || card.USER_CARD_END;
  };

  // 格式化过期时间
  const formatExpireDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return language === 'zh'
      ? `${month}月${day}日到期`
      : `Expires ${month}/${day}`;
  };

  return (
    <div className="card-selector">
      <div className="cost-hint">
        <CreditCard size={16} />
        <span>{getCostHint()}</span>
      </div>

      <div className="cards-list">
        {cards.map(card => {
          const { cardName, balance, deduct, unit, isTimesCard } = getCardInfo(card);
          const isSelected = selectedId === card._id;
          const expired = isExpired(card);

          return (
            <div
              key={card._id}
              className={`card-option ${isSelected ? 'selected' : ''} ${expired ? 'expired' : ''}`}
              onClick={() => !expired && onSelect(card._id)}
            >
              <div className="card-radio">
                {isSelected ? (
                  <div className="radio-checked">
                    <Check size={14} />
                  </div>
                ) : (
                  <Circle size={20} className="radio-unchecked" />
                )}
              </div>

              <div className="card-icon">
                {isTimesCard ? <Coins size={20} /> : <CreditCard size={20} />}
              </div>

              <div className="card-info">
                <span className="card-name">{cardName}</span>
                <span className="card-balance">
                  {language === 'zh' ? '剩余 ' : 'Remaining: '}
                  {isTimesCard ? `${balance}${unit}` : `¥${(balance || 0).toFixed(2)}`}
                </span>
                {getExpireTime(card) && (
                  <span className="card-expire">
                    {formatExpireDate(getExpireTime(card))}
                  </span>
                )}
              </div>

              <div className="card-deduct">
                <span className="deduct-label">
                  {language === 'zh' ? '将扣' : 'Deduct'}
                </span>
                <span className="deduct-value">
                  {isTimesCard ? `-${deduct}${unit}` : `-¥${deduct}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CardSelector;
