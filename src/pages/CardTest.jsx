/**
 * 卡项商城测试页面
 * 测试卡项相关的数据库查询功能
 */

import { useState } from 'react'
import {
  getCardList,
  getHomeCardList,
  getCardDetail
} from '../services/cardService'
import './CloudTest.css'

export default function CardTest() {
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cardData, setCardData] = useState(null)

  // 添加测试结果
  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, {
      message,
      type,
      time: new Date().toLocaleTimeString()
    }])
  }

  // 清空结果
  const clearResults = () => {
    setTestResults([])
    setCardData(null)
  }

  // 测试 1: 获取卡项列表
  const handleTestCardList = async () => {
    setLoading(true)
    addResult('🔄 正在获取卡项列表...', 'info')

    try {
      const cards = await getCardList({ limit: 10 })
      addResult(`✅ 成功获取 ${cards.length} 个卡项`, 'success')

      if (cards.length > 0) {
        setCardData(cards)
        cards.forEach((card, index) => {
          addResult(
            `   ${index + 1}. ${card.CARD_NAME} - ¥${card.CARD_PRICE || 0} - ${card.CARD_TIMES || 0}次`,
            'success'
          )
        })
      } else {
        addResult('   数据库中暂无卡项数据', 'warning')
      }
    } catch (error) {
      addResult('❌ 获取卡项列表失败: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 测试 2: 获取首页推荐卡项
  const handleTestHomeCards = async () => {
    setLoading(true)
    addResult('🔄 正在获取首页推荐卡项...', 'info')

    try {
      const cards = await getHomeCardList(6)
      addResult(`✅ 成功获取 ${cards.length} 个推荐卡项`, 'success')

      if (cards.length > 0) {
        setCardData(cards)
        cards.forEach((card, index) => {
          addResult(
            `   ${index + 1}. ${card.CARD_NAME} - ${card.CARD_TIMES || 0} 次`,
            'success'
          )
        })
      } else {
        addResult('   暂无推荐卡项', 'warning')
      }
    } catch (error) {
      addResult('❌ 获取推荐卡项失败: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 测试 3: 查看卡项详情
  const handleTestCardDetail = async () => {
    if (!cardData || cardData.length === 0) {
      addResult('⚠️ 请先获取卡项列表', 'warning')
      return
    }

    setLoading(true)
    const firstCard = cardData[0]
    addResult(`🔄 正在查询卡项详情: ${firstCard.CARD_NAME}...`, 'info')

    try {
      const detail = await getCardDetail(firstCard._id)
      addResult('✅ 成功获取卡项详情', 'success')
      addResult(`   卡项名称: ${detail.CARD_NAME}`, 'success')
      addResult(`   卡项价格: ¥${detail.CARD_PRICE || 0}`, 'success')
      addResult(`   卡项次数: ${detail.CARD_TIMES || 0} 次`, 'success')
      addResult(`   有效期: ${detail.CARD_VALIDITY_DAYS || 0} 天`, 'success')
      addResult(`   状态: ${detail.CARD_STATUS === 1 ? '上架' : '下架'}`, 'success')
    } catch (error) {
      addResult('❌ 获取卡项详情失败: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 测试 4: 查看数据库表结构
  const handleTestDatabase = async () => {
    setLoading(true)
    addResult('🔄 正在查询数据库表结构...', 'info')

    try {
      const cards = await getCardList({ limit: 1 })

      if (cards.length > 0) {
        addResult('✅ 卡项表 (ax_card_item) 字段:', 'success')
        const fields = Object.keys(cards[0])
        fields.forEach(field => {
          addResult(`   - ${field}: ${typeof cards[0][field]}`, 'info')
        })
      } else {
        addResult('⚠️ 数据库中暂无数据', 'warning')
      }
    } catch (error) {
      addResult('❌ 查询失败: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cloud-test">
      <div className="test-header">
        <h1>🎫 卡项商城测试</h1>
        <p className="subtitle">测试卡项数据库查询功能</p>
      </div>

      <div className="test-controls">
        <h2>数据库信息</h2>
        <div className="test-info">
          <p><strong>环境 ID:</strong> cloud1-6gnd02he13c1ff2e</p>
          <p><strong>数据表:</strong></p>
          <ul>
            <li>ax_card_item - 卡项商品表</li>
            <li>ax_user_card - 用户卡项表</li>
            <li>ax_card_record - 卡项使用记录表</li>
          </ul>
        </div>

        <h2>测试操作</h2>

        <div className="button-group">
          <button
            onClick={handleTestCardList}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '查询中...' : '1. 获取卡项列表'}
          </button>

          <button
            onClick={handleTestHomeCards}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '查询中...' : '2. 获取推荐卡项'}
          </button>

          <button
            onClick={handleTestCardDetail}
            disabled={loading || !cardData}
            className="btn-primary"
          >
            {loading ? '查询中...' : '3. 查看卡项详情'}
          </button>

          <button
            onClick={handleTestDatabase}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '查询中...' : '4. 查看表结构'}
          </button>

          <button
            onClick={clearResults}
            disabled={loading || testResults.length === 0}
            className="btn-secondary"
          >
            清空日志
          </button>
        </div>
      </div>

      <div className="test-results">
        <div className="results-header">
          <h2>测试日志</h2>
          <span className="result-count">{testResults.length} 条记录</span>
        </div>

        <div className="results-console">
          {testResults.length === 0 ? (
            <div className="empty-state">
              点击上方按钮开始测试卡项功能...
            </div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className={`result-item ${result.type}`}>
                <span className="time">[{result.time}]</span>
                <span className="message">{result.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {cardData && cardData.length > 0 && (
        <div className="test-footer">
          <h3>卡项数据预览</h3>
          <div className="card-preview">
            {cardData.slice(0, 3).map((card, index) => (
              <div key={index} className="card-item">
                <h4>{card.CARD_NAME}</h4>
                <p className="price">¥{card.CARD_PRICE || 0}</p>
                <p className="count">{card.CARD_TIMES || 0} 次</p>
                <p className="days">有效期 {card.CARD_VALIDITY_DAYS || 0} 天</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="test-footer">
        <h3>路由映射</h3>
        <div className="next-steps">
          <div className="step">
            <strong>card/list</strong>
            <p>→ getCardList() - 获取卡项列表</p>
          </div>
          <div className="step">
            <strong>card/home_list</strong>
            <p>→ getHomeCardList() - 首页推荐卡项</p>
          </div>
          <div className="step">
            <strong>card/view</strong>
            <p>→ getCardDetail() - 查看卡项详情</p>
          </div>
          <div className="step">
            <strong>card/my_cards</strong>
            <p>→ getMyCards() - 我的卡项列表</p>
          </div>
        </div>
      </div>
    </div>
  )
}
