/**
 * 卡项管理页面
 * 支持查看、编辑、上下架卡项
 */

import { useState, useEffect } from 'react'
import { getCardList, updateCard, toggleCardStatus } from '../../../services/adminService'
import './CardManagement.css'

export default function CardManagement() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, online, offline
  const [editingCard, setEditingCard] = useState(null)

  useEffect(() => {
    loadCards()
  }, [filter])

  const loadCards = async () => {
    setLoading(true)
    setError(null)

    try {
      const statusFilter = filter === 'all' ? undefined : (filter === 'online' ? 1 : 0)
      const result = await getCardList({ status: statusFilter, limit: 100 })

      if (result.success) {
        setCards(result.data)
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('加载卡项失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (card) => {
    const newStatus = card.CARD_STATUS === 1 ? 0 : 1
    const result = await toggleCardStatus(card._id, newStatus)

    if (result.success) {
      setCards(cards.map(c =>
        c._id === card._id ? { ...c, CARD_STATUS: newStatus } : c
      ))
      alert(newStatus === 1 ? '已上架' : '已下架')
    } else {
      alert('操作失败：' + result.message)
    }
  }

  const handleEditCard = (card) => {
    setEditingCard({ ...card })
  }

  const handleSaveEdit = async () => {
    if (!editingCard) return

    const updates = {
      CARD_NAME: editingCard.CARD_NAME,
      CARD_PRICE: editingCard.CARD_PRICE,
      CARD_TIMES: editingCard.CARD_TIMES,
      CARD_VALIDITY_DAYS: editingCard.CARD_VALIDITY_DAYS,
      CARD_ORDER: editingCard.CARD_ORDER,
      CARD_DESC: editingCard.CARD_DESC || ''
    }

    const result = await updateCard(editingCard._id, updates)

    if (result.success) {
      setCards(cards.map(c =>
        c._id === editingCard._id ? { ...c, ...updates } : c
      ))
      setEditingCard(null)
      alert('保存成功')
    } else {
      alert('保存失败：' + result.message)
    }
  }

  if (loading) {
    return (
      <div className="card-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-management">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadCards} className="retry-btn">重新加载</button>
        </div>
      </div>
    )
  }

  const filteredCards = cards

  return (
    <div className="card-management">
      {/* 头部 */}
      <div className="page-header">
        <h1>卡项管理</h1>
        <button onClick={loadCards} className="refresh-btn">
          刷新
        </button>
      </div>

      {/* 筛选器 */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            全部 ({cards.length})
          </button>
          <button
            className={filter === 'online' ? 'active' : ''}
            onClick={() => setFilter('online')}
          >
            已上架 ({cards.filter(c => c.CARD_STATUS === 1).length})
          </button>
          <button
            className={filter === 'offline' ? 'active' : ''}
            onClick={() => setFilter('offline')}
          >
            已下架 ({cards.filter(c => c.CARD_STATUS === 0).length})
          </button>
        </div>
      </div>

      {/* 卡项列表 */}
      <div className="cards-grid">
        {filteredCards.length === 0 ? (
          <div className="empty-state">
            暂无卡项数据
          </div>
        ) : (
          filteredCards.map(card => (
            <div key={card._id} className={`card-item ${card.CARD_STATUS === 0 ? 'offline' : ''}`}>
              <div className="card-header">
                <h3>{card.CARD_NAME}</h3>
                <span className={`status-badge ${card.CARD_STATUS === 1 ? 'online' : 'offline'}`}>
                  {card.CARD_STATUS === 1 ? '已上架' : '已下架'}
                </span>
              </div>

              <div className="card-info">
                <div className="info-row">
                  <span className="label">价格:</span>
                  <span className="value price">¥{card.CARD_PRICE || 0}</span>
                </div>
                <div className="info-row">
                  <span className="label">次数:</span>
                  <span className="value">{card.CARD_TIMES || 0} 次</span>
                </div>
                <div className="info-row">
                  <span className="label">有效期:</span>
                  <span className="value">{card.CARD_VALIDITY_DAYS || 0} 天</span>
                </div>
                <div className="info-row">
                  <span className="label">排序:</span>
                  <span className="value">{card.CARD_ORDER || 0}</span>
                </div>
                {card.CARD_DESC && (
                  <div className="info-row desc">
                    <span className="label">描述:</span>
                    <span className="value">{card.CARD_DESC}</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  onClick={() => handleEditCard(card)}
                  className="btn-edit"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleToggleStatus(card)}
                  className={card.CARD_STATUS === 1 ? 'btn-offline' : 'btn-online'}
                >
                  {card.CARD_STATUS === 1 ? '下架' : '上架'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 编辑弹窗 */}
      {editingCard && (
        <div className="modal-overlay" onClick={() => setEditingCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>编辑卡项</h2>
              <button className="close-btn" onClick={() => setEditingCard(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>卡项名称</label>
                <input
                  type="text"
                  value={editingCard.CARD_NAME}
                  onChange={(e) => setEditingCard({ ...editingCard, CARD_NAME: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>价格（元）</label>
                  <input
                    type="number"
                    value={editingCard.CARD_PRICE}
                    onChange={(e) => setEditingCard({ ...editingCard, CARD_PRICE: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>次数</label>
                  <input
                    type="number"
                    value={editingCard.CARD_TIMES}
                    onChange={(e) => setEditingCard({ ...editingCard, CARD_TIMES: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>有效期（天）</label>
                  <input
                    type="number"
                    value={editingCard.CARD_VALIDITY_DAYS}
                    onChange={(e) => setEditingCard({ ...editingCard, CARD_VALIDITY_DAYS: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>排序</label>
                  <input
                    type="number"
                    value={editingCard.CARD_ORDER}
                    onChange={(e) => setEditingCard({ ...editingCard, CARD_ORDER: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>描述</label>
                <textarea
                  rows="3"
                  value={editingCard.CARD_DESC || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, CARD_DESC: e.target.value })}
                  placeholder="卡项描述（选填）"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setEditingCard(null)} className="btn-cancel">
                取消
              </button>
              <button onClick={handleSaveEdit} className="btn-save">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
