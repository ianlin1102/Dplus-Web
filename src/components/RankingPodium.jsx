import React, { useState, useEffect } from 'react'
import { getCheckInRanking } from '../services/rankingService'
import { useLanguage } from '../i18n/LanguageContext'
import './RankingPodium.css'

const RankingPodium = ({ limit = 10 }) => {
  const { language } = useLanguage()
  const [type, setType] = useState('all') // 'all' | 'month'
  const [rankList, setRankList] = useState([])
  const [loading, setLoading] = useState(true)
  const [maxCount, setMaxCount] = useState(1)

  // 加载排行榜数据
  const loadRankData = async (rankType) => {
    setLoading(true)
    try {
      const result = await getCheckInRanking(rankType, limit)
      if (result.code === 200 && result.data && result.data.list) {
        const list = result.data.list
        // 计算最大签到次数用于高度比例
        const max = list.length > 0 ? Math.max(...list.map(i => i.checkinCount)) : 1
        setMaxCount(max)
        setRankList(list)
      } else {
        setRankList([])
      }
    } catch (error) {
      console.error('加载排行榜失败:', error)
      setRankList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRankData(type)
  }, [type])

  // 切换榜单类型
  const handleToggle = () => {
    setType(prev => prev === 'all' ? 'month' : 'all')
  }

  // 计算柱子高度（相对于最大值的比例）
  const getBarHeight = (count) => {
    const minHeight = 60
    const maxHeight = 140
    const ratio = count / maxCount
    return minHeight + (maxHeight - minHeight) * ratio
  }

  // 前3名
  const topThree = rankList.slice(0, 3)
  // 第4名及以后
  const restList = rankList.slice(3)

  return (
    <div className="ranking-podium">
      {/* Toggle 切换按钮 */}
      <div className="ranking-toggle">
        <button
          className={`toggle-btn ${type === 'all' ? 'active' : ''}`}
          onClick={() => setType('all')}
        >
          {language === 'zh' ? '总榜' : 'All Time'}
        </button>
        <button
          className={`toggle-btn ${type === 'month' ? 'active' : ''}`}
          onClick={() => setType('month')}
        >
          {language === 'zh' ? '月榜' : 'Monthly'}
        </button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="ranking-loading">
          <div className="spinner"></div>
          <span>{language === 'zh' ? '加载中...' : 'Loading...'}</span>
        </div>
      )}

      {/* 领奖台 - 前3名 */}
      {!loading && topThree.length > 0 && (
        <div className="podium-container">
          <div className="podium">
            {/* 第2名 - 左侧 */}
            {topThree[1] && (
              <div className="podium-item rank-2">
                <div className="podium-avatar">
                  {topThree[1].userName?.substring(0, 1) || '?'}
                </div>
                <div
                  className="podium-bar"
                  style={{ height: `${getBarHeight(topThree[1].checkinCount)}px` }}
                >
                  <span className="bar-rank">2</span>
                </div>
                <div className="podium-info">
                  <div className="podium-name">{topThree[1].userName}</div>
                  <div className="podium-count">{topThree[1].checkinCount}次</div>
                </div>
              </div>
            )}

            {/* 第1名 - 中间 */}
            {topThree[0] && (
              <div className="podium-item rank-1">
                <div className="crown-icon">👑</div>
                <div className="podium-avatar">
                  {topThree[0].userName?.substring(0, 1) || '?'}
                </div>
                <div
                  className="podium-bar"
                  style={{ height: `${getBarHeight(topThree[0].checkinCount)}px` }}
                >
                  <span className="bar-rank">1</span>
                </div>
                <div className="podium-info">
                  <div className="podium-name">{topThree[0].userName}</div>
                  <div className="podium-count">{topThree[0].checkinCount}次</div>
                </div>
              </div>
            )}

            {/* 第3名 - 右侧 */}
            {topThree[2] && (
              <div className="podium-item rank-3">
                <div className="podium-avatar">
                  {topThree[2].userName?.substring(0, 1) || '?'}
                </div>
                <div
                  className="podium-bar"
                  style={{ height: `${getBarHeight(topThree[2].checkinCount)}px` }}
                >
                  <span className="bar-rank">3</span>
                </div>
                <div className="podium-info">
                  <div className="podium-name">{topThree[2].userName}</div>
                  <div className="podium-count">{topThree[2].checkinCount}次</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 第4名及以后的列表 */}
      {!loading && restList.length > 0 && (
        <div className="rank-list">
          {restList.map((item) => (
            <div key={item.userId} className="rank-list-item">
              <span className="rank-num">#{item.rank}</span>
              <div className="rank-avatar">
                {item.userName?.substring(0, 1) || '?'}
              </div>
              <span className="rank-name">{item.userName}</span>
              <span className="rank-count">{item.checkinCount}次</span>
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && rankList.length === 0 && (
        <div className="ranking-empty">
          <span className="empty-icon">🏆</span>
          <span className="empty-text">
            {language === 'zh' ? '暂无排行数据' : 'No ranking data'}
          </span>
        </div>
      )}
    </div>
  )
}

export default RankingPodium
