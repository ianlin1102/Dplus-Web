/**
 * 卡项选择器组件 - Dropdown 样式
 * 用于预约时选择支付卡项
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Coins, AlertCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import './CardSelector.css';

/**
 * 检查卡项余额是否足够
 */
const isCardSufficient = (card, costSet) => {
  if (!costSet?.isEnabled || costSet?.costType === 'free') return true;

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
  allUserCards = [],
  selectedId,
  onSelect,
  costSet = {},
  language = 'zh'
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayCards = allUserCards.length > 0 ? allUserCards : cards;

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const sufficientCards = displayCards.filter(card => isCardSufficient(card, costSet));
  const hasInsufficientCards = sufficientCards.length === 0 && displayCards.length > 0;

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
    return language === 'zh'
      ? `需消耗 ${costSet.timesCost} 次 或 ¥${costSet.balanceCost}`
      : `Requires ${costSet.timesCost} class(es) or ¥${costSet.balanceCost}`;
  };

  const getCardInfo = (card) => {
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

  const isExpired = (card) => {
    const expireTime = card.USER_CARD_EXPIRE_TIME;
    if (!expireTime || expireTime === 0) return false;
    return expireTime < Date.now();
  };

  const selectedCard = displayCards.find(c => c._id === selectedId);
  const selectedInfo = selectedCard ? getCardInfo(selectedCard) : null;

  const handleSelect = (cardId) => {
    onSelect(cardId);
    setOpen(false);
  };

  return (
    <div className="card-selector">
      <div className="cost-hint">
        <CreditCard size={16} />
        <span>{getCostHint()}</span>
      </div>

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

      {/* Dropdown */}
      <div className="card-dropdown" ref={dropdownRef}>
        <button
          className={`card-dropdown-trigger ${open ? 'open' : ''} ${!selectedCard ? 'placeholder' : ''}`}
          onClick={() => setOpen(!open)}
          type="button"
        >
          {selectedInfo ? (
            <div className="trigger-content">
              <span className="trigger-icon">
                {selectedInfo.isTimesCard ? <Coins size={18} /> : <CreditCard size={18} />}
              </span>
              <span className="trigger-name">{selectedInfo.cardName}</span>
              <span className="trigger-balance">
                {selectedInfo.isTimesCard
                  ? `${selectedInfo.balance}${selectedInfo.unit}`
                  : `¥${(selectedInfo.balance || 0).toFixed(2)}`}
              </span>
              <span className="trigger-deduct">
                {selectedInfo.isTimesCard
                  ? `-${selectedInfo.deduct}${selectedInfo.unit}`
                  : `-¥${selectedInfo.deduct}`}
              </span>
            </div>
          ) : (
            <span className="trigger-placeholder">
              {language === 'zh' ? '请选择卡项' : 'Select a card'}
            </span>
          )}
          <ChevronDown size={18} className={`trigger-arrow ${open ? 'rotated' : ''}`} />
        </button>

        {open && (
          <div className="card-dropdown-menu">
            {displayCards.map(card => {
              const { cardName, balance, deduct, unit, isTimesCard } = getCardInfo(card);
              const isSelected = selectedId === card._id;
              const expired = isExpired(card);
              const insufficient = !isCardSufficient(card, costSet);
              const isDisabled = expired || insufficient;

              return (
                <div
                  key={card._id}
                  className={`card-dropdown-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleSelect(card._id)}
                >
                  <span className="item-icon">
                    {isTimesCard ? <Coins size={16} /> : <CreditCard size={16} />}
                  </span>
                  <div className="item-info">
                    <span className="item-name">{cardName}</span>
                    <span className="item-balance">
                      {language === 'zh' ? '剩余 ' : 'Bal: '}
                      {isTimesCard ? `${balance}${unit}` : `¥${(balance || 0).toFixed(2)}`}
                    </span>
                    {insufficient && !expired && (
                      <span className="insufficient-tag">
                        {language === 'zh' ? '余额不足' : 'Insufficient'}
                      </span>
                    )}
                    {expired && (
                      <span className="expired-tag">
                        {language === 'zh' ? '已过期' : 'Expired'}
                      </span>
                    )}
                  </div>
                  <span className="item-deduct">
                    {isTimesCard ? `-${deduct}${unit}` : `-¥${deduct}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardSelector;
