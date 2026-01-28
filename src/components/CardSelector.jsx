/**
 * 卡项选择器组件
 * 用于预约时选择支付卡项
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, CreditCard, Coins, AlertCircle, AlertTriangle } from 'lucide-react';
import './CardSelector.css';

/**
 * 检查卡项余额是否足够
 * @param {Object} card - 卡项
 * @param {Object} costSet - 费用配置
 * @returns {boolean} 是否余额充足
 */
const isCardSufficient = (card, costSet) => {
  if (!costSet?.isEnabled || costSet?.costType === 'free') return true;

  // USER_CARD_TYPE: 1=次数卡, 2=余额卡
  const isTimesCard = card.USER_CARD_TYPE === 1;
  const remainTimes = card.USER_CARD_REMAIN_TIMES || 0;
  const remainBalance = card.USER_CARD_REMAIN_AMOUNT || 0;

  if (costSet.costType === 'times') {
    return isTimesCard && remainTimes >= (costSet.timesCost || 1);
  } else if (costSet.costType === 'balance') {
    return !isTimesCard && remainBalance >= (costSet.balanceCost || 0);
  } else if (costSet.costType === 'both') {
    if (isTimesCard) return remainTimes >= (costSet.timesCost || 1);
    return remainBalance >= (costSet.balanceCost || 0);
  }
  return true;
};

const CardSelector = ({
  cards = [],
  allUserCards = [], // 新增：用户所有卡项（包括余额不足的）
  selectedId,
  onSelect,
  costSet = {},
  language = 'zh'
}) => {
  // 获取用于显示的卡项列表（如果传入 allUserCards 则使用，否则使用 cards）
  const displayCards = allUserCards.length > 0 ? allUserCards : cards;

  // 无可用卡项
  if (!displayCards || displayCards.length === 0) {
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

  // 检查是否所有卡项余额都不足
  const sufficientCards = displayCards.filter(card => isCardSufficient(card, costSet));
  const hasInsufficientCards = sufficientCards.length === 0 && displayCards.length > 0;

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
    // 正确字段：USER_CARD_CARD_NAME, USER_CARD_REMAIN_TIMES, USER_CARD_REMAIN_AMOUNT
    const isTimesCard = card.USER_CARD_TYPE === 1;
    const cardName = card.USER_CARD_CARD_NAME ||
      (language === 'zh' ? (isTimesCard ? '次数卡' : '余额卡') : (isTimesCard ? 'Class Pack' : 'Credit Card'));

    let balance, deduct, unit;

    if (isTimesCard) {
      balance = card.USER_CARD_REMAIN_TIMES || 0;
      deduct = costSet.timesCost || 1;
      unit = language === 'zh' ? '次' : ' class(es)';
    } else {
      balance = card.USER_CARD_REMAIN_AMOUNT || 0;
      deduct = costSet.balanceCost || 0;
      unit = '';
    }

    return { cardName, balance, deduct, unit, isTimesCard };
  };

  // 检查卡项是否过期
  const isExpired = (card) => {
    const expireTime = card.USER_CARD_EXPIRE_TIME;
    if (!expireTime || expireTime === 0) return false;
    return expireTime < Date.now();
  };

  // 获取过期时间
  const getExpireTime = (card) => {
    return card.USER_CARD_EXPIRE_TIME;
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

      {/* 所有卡项余额不足警告 */}
      {hasInsufficientCards && (
        <div className="insufficient-warning">
          <AlertTriangle size={18} />
          <div className="warning-content">
            <p className="warning-title">
              {language === 'zh' ? '卡项余额不足' : 'Insufficient Balance'}
            </p>
            <p className="warning-desc">
              {language === 'zh'
                ? '您当前所有卡项的余额都不足以支付此预约，请先充值或购买新卡项'
                : 'All your cards have insufficient balance for this booking. Please top up or purchase a new card.'}
            </p>
            <Link to="/store" className="buy-card-link">
              {language === 'zh' ? '前往购买' : 'Go to Store'}
            </Link>
          </div>
        </div>
      )}

      <div className="cards-list">
        {displayCards.map(card => {
          const { cardName, balance, deduct, unit, isTimesCard } = getCardInfo(card);
          const isSelected = selectedId === card._id;
          const expired = isExpired(card);
          const insufficient = !isCardSufficient(card, costSet);
          const isDisabled = expired || insufficient;

          return (
            <div
              key={card._id}
              className={`card-option ${isSelected ? 'selected' : ''} ${expired ? 'expired' : ''} ${insufficient ? 'insufficient' : ''}`}
              onClick={() => !isDisabled && onSelect(card._id)}
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
                {/* 余额不足标签 */}
                {insufficient && !expired && (
                  <span className="insufficient-tag">
                    {language === 'zh' ? '余额不足' : 'Insufficient'}
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
