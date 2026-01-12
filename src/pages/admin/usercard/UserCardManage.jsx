/**
 * 用户卡项管理页面
 * Admin - User Card Management
 * 功能：搜索用户、查看/分配/调整卡项
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import {
  searchUserByPhone,
  searchByUniqueId,
  getUserCardList,
  addUserCard,
  adjustUserCard,
  getUserCardRecords
} from '../../../services/adminCardService'
import { getCardList } from '../../../services/adminService'
import './UserCardManage.css'

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const CoinsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
    <path d="M7 6h1v4"/>
    <path d="m16.71 13.88.7.71-2.82 2.82"/>
  </svg>
)

export default function UserCardManage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  // 搜索状态
  const [searchType, setSearchType] = useState('phone') // phone 或 uniqueId
  const [searchValue, setSearchValue] = useState('')
  const [searching, setSearching] = useState(false)

  // 用户和卡项数据
  const [user, setUser] = useState(null)
  const [userCards, setUserCards] = useState([])
  const [cardProducts, setCardProducts] = useState([]) // 可分配的卡项商品

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardRecords, setCardRecords] = useState([])

  // 表单状态
  const [addForm, setAddForm] = useState({
    cardName: '',
    type: 1, // 1=次数卡, 2=余额卡
    times: 0,
    amount: 0,
    reason: '',
    paymentMethod: ''
  })

  const [adjustForm, setAdjustForm] = useState({
    changeTimes: 0,
    changeAmount: 0,
    reason: ''
  })

  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // 搜索用户
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault()
    if (!searchValue.trim()) {
      setError('请输入搜索内容')
      return
    }

    setSearching(true)
    setError(null)
    setUser(null)
    setUserCards([])

    try {
      let result
      if (searchType === 'phone') {
        result = await searchUserByPhone(searchValue.trim())
      } else {
        result = await searchByUniqueId(searchValue.trim())
      }

      if (result.success && result.data) {
        setUser(result.data.user)
        setUserCards(result.data.cards || [])
      } else {
        setError(result.message || '未找到用户')
      }
    } catch (err) {
      console.error('搜索失败:', err)
      setError(err.message || '搜索失败')
    } finally {
      setSearching(false)
    }
  }, [searchType, searchValue])

  // 加载可分配的卡项商品
  const loadCardProducts = useCallback(async () => {
    try {
      const result = await getCardList({ status: 1 })
      if (result.success) {
        setCardProducts(result.data || [])
      }
    } catch (err) {
      console.error('加载卡项商品失败:', err)
    }
  }, [])

  // 打开添加卡项弹窗
  const openAddModal = async () => {
    await loadCardProducts()
    setAddForm({
      cardName: '',
      type: 1,
      times: 0,
      amount: 0,
      reason: '',
      paymentMethod: ''
    })
    setShowAddModal(true)
  }

  // 添加/充值卡项
  const handleAddCard = async () => {
    if (!addForm.cardName) {
      setError('请输入卡项名称')
      return
    }
    if (addForm.type === 1 && addForm.times <= 0) {
      setError('请输入充值次数')
      return
    }
    if (addForm.type === 2 && addForm.amount <= 0) {
      setError('请输入充值金额')
      return
    }
    if (!addForm.reason) {
      setError('请输入充值原因')
      return
    }

    try {
      const result = await addUserCard({
        userId: user._id,
        cardName: addForm.cardName,
        type: addForm.type,
        times: addForm.type === 1 ? addForm.times : 0,
        amount: addForm.type === 2 ? addForm.amount : 0,
        reason: addForm.reason,
        paymentMethod: addForm.paymentMethod
      })

      if (result.success) {
        setSuccessMsg('卡项添加成功')
        setShowAddModal(false)
        // 刷新用户卡项列表
        handleSearch()
      } else {
        setError(result.message || '添加失败')
      }
    } catch (err) {
      setError(err.message || '添加失败')
    }
  }

  // 打开调整弹窗
  const openAdjustModal = (card) => {
    setSelectedCard(card)
    setAdjustForm({
      changeTimes: 0,
      changeAmount: 0,
      reason: ''
    })
    setShowAdjustModal(true)
  }

  // 调整卡项
  const handleAdjustCard = async () => {
    if (!adjustForm.reason) {
      setError('请输入调整原因')
      return
    }

    const isTimesCard = selectedCard.USER_CARD_TYPE === 1
    if (isTimesCard && adjustForm.changeTimes === 0) {
      setError('请输入调整次数')
      return
    }
    if (!isTimesCard && adjustForm.changeAmount === 0) {
      setError('请输入调整金额')
      return
    }

    try {
      const result = await adjustUserCard({
        userCardId: selectedCard._id,
        changeTimes: isTimesCard ? adjustForm.changeTimes : 0,
        changeAmount: !isTimesCard ? adjustForm.changeAmount : 0,
        reason: adjustForm.reason
      })

      if (result.success) {
        setSuccessMsg('卡项调整成功')
        setShowAdjustModal(false)
        setSelectedCard(null)
        // 刷新用户卡项列表
        handleSearch()
      } else {
        setError(result.message || '调整失败')
      }
    } catch (err) {
      setError(err.message || '调整失败')
    }
  }

  // 查看卡项记录
  const openHistoryModal = async (card) => {
    setSelectedCard(card)
    setCardRecords([])
    setShowHistoryModal(true)

    try {
      const result = await getUserCardRecords(user._id, card._id)
      if (result.success) {
        setCardRecords(result.data?.list || [])
      }
    } catch (err) {
      console.error('加载记录失败:', err)
    }
  }

  // 格式化日期
  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const d = new Date(timestamp)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化过期日期
  const formatExpireDate = (timestamp) => {
    if (!timestamp) return '永久有效'
    const d = new Date(timestamp)
    const now = new Date()
    const isExpired = d < now
    return (
      <span className={isExpired ? 'expired' : ''}>
        {d.toLocaleDateString('zh-CN')} {isExpired ? '(已过期)' : ''}
      </span>
    )
  }

  // 自动隐藏成功消息
  if (successMsg) {
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  return (
    <div className="user-card-manage">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <BackIcon />
          <span>返回</span>
        </button>
        <div className="header-content">
          <h1>用户卡项管理</h1>
          <p className="subtitle">搜索用户、分配和调整卡项</p>
        </div>
      </div>

      {/* 消息提示 */}
      {error && (
        <div className="message error">
          {error}
          <button onClick={() => setError(null)}><CloseIcon /></button>
        </div>
      )}
      {successMsg && (
        <div className="message success">
          {successMsg}
        </div>
      )}

      {/* 搜索区域 */}
      <div className="search-section">
        <div className="search-type-tabs">
          <button
            className={searchType === 'phone' ? 'active' : ''}
            onClick={() => setSearchType('phone')}
          >
            手机号搜索
          </button>
          <button
            className={searchType === 'uniqueId' ? 'active' : ''}
            onClick={() => setSearchType('uniqueId')}
          >
            卡项识别码
          </button>
        </div>
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder={searchType === 'phone' ? '输入用户手机号...' : '输入卡项唯一识别码...'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn" disabled={searching}>
            {searching ? '搜索中...' : '搜索'}
          </button>
        </form>
      </div>

      {/* 用户信息 */}
      {user && (
        <div className="user-info-section">
          <div className="user-card">
            <div className="user-avatar">
              {user.USER_NAME?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <h3>{user.USER_NAME || '未设置昵称'}</h3>
              <p>手机: {user.USER_MOBILE || '未绑定'}</p>
              <p>注册时间: {formatDate(user.USER_ADD_TIME || user._createTime)}</p>
            </div>
            <button className="add-card-btn" onClick={openAddModal}>
              <PlusIcon />
              <span>添加卡项</span>
            </button>
          </div>
        </div>
      )}

      {/* 用户卡项列表 */}
      {user && (
        <div className="cards-section">
          <h2>持有卡项 ({userCards.length})</h2>
          {userCards.length === 0 ? (
            <div className="empty-state">
              <CreditCardIcon />
              <p>该用户暂无卡项</p>
            </div>
          ) : (
            <div className="cards-grid">
              {userCards.map((card) => {
                const isTimesCard = card.USER_CARD_TYPE === 1
                return (
                  <div key={card._id} className="card-item">
                    <div className="card-icon">
                      {isTimesCard ? <CoinsIcon /> : <CreditCardIcon />}
                    </div>
                    <div className="card-info">
                      <h4>{card.USER_CARD_TITLE || card.USER_CARD_NAME || '未命名卡项'}</h4>
                      <p className="card-balance">
                        {isTimesCard
                          ? `剩余 ${card.USER_CARD_CNT || 0} 次`
                          : `余额 ¥${(card.USER_CARD_BALANCE || 0).toFixed(2)}`
                        }
                      </p>
                      <p className="card-expire">
                        有效期: {formatExpireDate(card.USER_CARD_EXPIRE_TIME || card.USER_CARD_END)}
                      </p>
                      {card.USER_CARD_UNIQUE_ID && (
                        <p className="card-unique-id">
                          识别码: {card.USER_CARD_UNIQUE_ID}
                        </p>
                      )}
                    </div>
                    <div className="card-actions">
                      <button
                        className="action-btn adjust"
                        onClick={() => openAdjustModal(card)}
                        title="调整"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className="action-btn history"
                        onClick={() => openHistoryModal(card)}
                        title="记录"
                      >
                        <HistoryIcon />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 添加卡项弹窗 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加/充值卡项</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>卡项名称</label>
                <input
                  type="text"
                  value={addForm.cardName}
                  onChange={(e) => setAddForm({...addForm, cardName: e.target.value})}
                  placeholder="例如：10次课程卡"
                />
              </div>

              <div className="form-group">
                <label>卡项类型</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      checked={addForm.type === 1}
                      onChange={() => setAddForm({...addForm, type: 1})}
                    />
                    次数卡
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={addForm.type === 2}
                      onChange={() => setAddForm({...addForm, type: 2})}
                    />
                    余额卡
                  </label>
                </div>
              </div>

              {addForm.type === 1 ? (
                <div className="form-group">
                  <label>充值次数</label>
                  <input
                    type="number"
                    value={addForm.times}
                    onChange={(e) => setAddForm({...addForm, times: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>充值金额 (元)</label>
                  <input
                    type="number"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({...addForm, amount: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <div className="form-group">
                <label>充值原因</label>
                <input
                  type="text"
                  value={addForm.reason}
                  onChange={(e) => setAddForm({...addForm, reason: e.target.value})}
                  placeholder="例如：购买课程包、赠送、补偿等"
                />
              </div>

              <div className="form-group">
                <label>支付方式 (可选)</label>
                <select
                  value={addForm.paymentMethod}
                  onChange={(e) => setAddForm({...addForm, paymentMethod: e.target.value})}
                >
                  <option value="">请选择</option>
                  <option value="wechat">微信支付</option>
                  <option value="alipay">支付宝</option>
                  <option value="cash">现金</option>
                  <option value="transfer">转账</option>
                  <option value="gift">赠送</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn-confirm" onClick={handleAddCard}>确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 调整卡项弹窗 */}
      {showAdjustModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>调整卡项</h3>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="current-info">
                <p>卡项: {selectedCard.USER_CARD_TITLE || selectedCard.USER_CARD_NAME}</p>
                <p>
                  当前余额: {selectedCard.USER_CARD_TYPE === 1
                    ? `${selectedCard.USER_CARD_CNT || 0} 次`
                    : `¥${(selectedCard.USER_CARD_BALANCE || 0).toFixed(2)}`
                  }
                </p>
              </div>

              {selectedCard.USER_CARD_TYPE === 1 ? (
                <div className="form-group">
                  <label>调整次数 (正数增加，负数扣减)</label>
                  <input
                    type="number"
                    value={adjustForm.changeTimes}
                    onChange={(e) => setAdjustForm({...adjustForm, changeTimes: parseInt(e.target.value) || 0})}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>调整金额 (正数增加，负数扣减)</label>
                  <input
                    type="number"
                    value={adjustForm.changeAmount}
                    onChange={(e) => setAdjustForm({...adjustForm, changeAmount: parseFloat(e.target.value) || 0})}
                    step="0.01"
                  />
                </div>
              )}

              <div className="form-group">
                <label>调整原因</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                  placeholder="例如：系统调整、退款、补偿等"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAdjustModal(false)}>取消</button>
              <button className="btn-confirm" onClick={handleAdjustCard}>确认调整</button>
            </div>
          </div>
        </div>
      )}

      {/* 使用记录弹窗 */}
      {showHistoryModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>使用记录 - {selectedCard.USER_CARD_TITLE || selectedCard.USER_CARD_NAME}</h3>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              {cardRecords.length === 0 ? (
                <div className="empty-records">
                  <p>暂无使用记录</p>
                </div>
              ) : (
                <div className="records-list">
                  {cardRecords.map((record, index) => (
                    <div key={record._id || index} className="record-item">
                      <div className="record-info">
                        <span className="record-type">{record.RECORD_TYPE_TEXT || record.RECORD_TYPE}</span>
                        <span className="record-change">
                          {record.RECORD_CHANGE > 0 ? '+' : ''}{record.RECORD_CHANGE}
                          {selectedCard.USER_CARD_TYPE === 1 ? '次' : '元'}
                        </span>
                      </div>
                      <div className="record-meta">
                        <span className="record-reason">{record.RECORD_REASON || '-'}</span>
                        <span className="record-time">{formatDate(record.RECORD_ADD_TIME)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowHistoryModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
