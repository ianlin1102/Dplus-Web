import React, { useState } from 'react'
import { getCheckInRanking } from '../services/rankingService'
import { useLanguage } from '../i18n/LanguageContext'
import { useDataWithRetry } from '../hooks/useDataWithRetry'
import DataPlaceholder from './DataPlaceholder'
import './RankingPodium.css'

const RankingPodium = ({ limit = 10 }) => {
  const { t, language } = useLanguage()
  const [type, setType] = useState('all') // 'all' | 'month'

  // 使用自动重试 Hook 加载排行榜数据
  const {
    data: rankList,
    loading,
    error,
    hasData,
    retry,
    retryCount
  } = useDataWithRetry(
    async () => {
      const result = await getCheckInRanking(type, limit)
      if (result.code === 200 && result.data) {
        return result.data.list || []
      }
      return []
    },
    {
      cacheKey: `ranking_${type}_${limit}`,
      cacheTTL: 30 * 60 * 1000, // 30分钟
      retryInterval: 60000, // 1分钟
      enableRetry: true
    }
  )

  const handleRefresh = () => {
    // 清除本地缓存并重新加载
    localStorage.removeItem(`ranking_${type}_${limit}`)
    retry()
  }

  const handleTabChange = (newType) => {
    setType(newType)
  }

  // 获取前三名和其余列表
  const topThree = rankList ? rankList.slice(0, 3) : []
  const restList = rankList ? rankList.slice(3) : []

  return (
    <div className="ranking-podium">
      {/* Tab 切换 */}
      <div className="ranking-podium__tabs">
        <button
          className={`ranking-podium__tab ${type === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          {t('home.totalRank', '总榜')}
        </button>
        <button
          className={`ranking-podium__tab ${type === 'month' ? 'active' : ''}`}
          onClick={() => handleTabChange('month')}
        >
          {t('home.monthRank', '月榜')}
        </button>
        <button
          className="ranking-podium__refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 加载状态或无数据显示 Placeholder */}
      {(loading || !hasData) && (
        <DataPlaceholder
          type="ranking"
          count={5}
          message={language === 'zh' ? '正在加载排行榜数据...' : 'Loading ranking data...'}
          retryCount={retryCount}
        />
      )}

      {/* 颁奖台 - 前三名 */}
      {hasData && topThree.length > 0 && (
        <div className="ranking-podium__podium">
          {topThree.map((item, index) => (
            <div
              key={item.userId}
              className={`ranking-podium__place ranking-podium__place--${index + 1}`}
            >
              <div className="ranking-podium__medal">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
              </div>
              <div className="ranking-podium__avatar">
                {item.userName ? item.userName[0] : '?'}
              </div>
              <div className="ranking-podium__user">
                <div className="ranking-podium__rank">#{item.rank}</div>
                <div className="ranking-podium__username">{item.userName}</div>
                <div className="ranking-podium__count">{item.checkinCount}次</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 完整列表 - 4-10名 */}
      {hasData && restList.length > 0 && (
        <div className="ranking-podium__list">
          {restList.map((item) => (
            <div key={item.userId} className="ranking-podium__list-item">
              <div className="ranking-podium__list-rank">#{item.rank}</div>
              <div className="ranking-podium__list-avatar">
                {item.userName ? item.userName[0] : '?'}
              </div>
              <div className="ranking-podium__list-name">{item.userName}</div>
              <div className="ranking-podium__list-count">{item.checkinCount}次</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RankingPodium
