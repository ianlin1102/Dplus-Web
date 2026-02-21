import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getCheckInRanking, getUserCheckinStats } from '../services/rankingService'
import { useLanguage } from '../i18n/LanguageContext'
import { convertCloudUrl } from '../utils/cloudUrlHelper'
import './RankingPodium.css'

const CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存

/**
 * 获取当前登录用户的 userId
 */
const getCurrentUserId = () => {
  try {
    const authInfo = localStorage.getItem('auth_info')
    if (authInfo) {
      const parsed = JSON.parse(authInfo)
      if (parsed.user && parsed.user.id) {
        return parsed.user.id
      }
    }
    const authData = localStorage.getItem('auth_user')
    if (authData) {
      const user = JSON.parse(authData)
      return user._id || user.USER_MINI_OPENID || ''
    }
  } catch (e) {
    // ignore
  }
  return ''
}

const RankingPodium = ({ limit = 10 }) => {
  const { language } = useLanguage()
  const [type, setType] = useState('all') // 'all' | 'month'
  const [rankList, setRankList] = useState([])
  const [loading, setLoading] = useState(true)
  const [maxCount, setMaxCount] = useState(1)
  const [userStats, setUserStats] = useState(null)
  const currentUserId = getCurrentUserId()

  // 前端缓存 (per tab)
  const cacheRef = useRef({ all: null, month: null })

  // 加载排行榜数据
  const loadRankData = async (rankType) => {
    // 检查前端缓存
    const cached = cacheRef.current[rankType]
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      setRankList(cached.rankList)
      setMaxCount(cached.maxCount)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const result = await getCheckInRanking(rankType, limit)
      if (result.code === 200 && result.data && result.data.list) {
        const list = result.data.list
        // 计算最大签到次数用于高度比例
        const max = list.length > 0 ? Math.max(...list.map(i => i.checkinCount)) : 1
        setMaxCount(max)
        setRankList(list)

        // 保存到前端缓存
        cacheRef.current[rankType] = {
          rankList: list,
          maxCount: max,
          timestamp: Date.now()
        }
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

  // 加载当前用户签到统计（只加载一次）
  const loadUserStats = async () => {
    const userId = getCurrentUserId()
    if (!userId) return

    try {
      const result = await getUserCheckinStats(userId)
      if (result.code === 200 && result.data) {
        setUserStats(result.data)
      }
    } catch (error) {
      console.error('加载用户签到统计失败:', error)
    }
  }

  // 用户统计只加载一次
  useEffect(() => {
    loadUserStats()
  }, [])

  // 排行榜数据跟随 type 变化
  useEffect(() => {
    loadRankData(type)
  }, [type])

  // 计算"我的排名"信息
  const myRankInfo = useMemo(() => {
    if (!currentUserId || !userStats) return null

    let inTop10 = false
    let rank = null
    let userName = userStats.userName || ''
    let userAvatar = userStats.userAvatar || ''

    for (let i = 0; i < rankList.length; i++) {
      if (rankList[i].userId === currentUserId) {
        inTop10 = true
        rank = rankList[i].rank || (i + 1)
        userName = rankList[i].userName || userName
        userAvatar = rankList[i].userAvatar || userAvatar
        break
      }
    }

    const checkinCount = type === 'all'
      ? (userStats.totalCount || 0)
      : (userStats.monthCount || 0)

    return { inTop10, rank, checkinCount, userName, userAvatar }
  }, [rankList, userStats, currentUserId, type])

  // 计算柱子高度（相对于最大值的比例）
  const getBarHeight = (count) => {
    const minHeight = 60
    const maxHeight = 140
    const ratio = count / maxCount
    return minHeight + (maxHeight - minHeight) * ratio
  }

  const DEFAULT_AVATAR = '/images/default-avatar.png'

  const handleImgError = (e) => { e.target.src = DEFAULT_AVATAR }

  // 渲染头像：有图片用图片，否则用默认头像
  const renderAvatar = (item, className = '') => {
    const avatarUrl = item.userAvatar ? convertCloudUrl(item.userAvatar) : ''
    return (
      <div className={`podium-avatar ${className}`}>
        <img src={avatarUrl || DEFAULT_AVATAR} alt="" className="avatar-img" onError={handleImgError} />
      </div>
    )
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
                {renderAvatar(topThree[1])}
                <div
                  className="podium-bar"
                  style={{ height: `${getBarHeight(topThree[1].checkinCount)}px` }}
                >
                  <span className="bar-rank">2</span>
                </div>
                <div className="podium-info">
                  <div className="podium-name">{topThree[1].userName}{currentUserId && topThree[1].userId === currentUserId && <span className="is-me-tag">{language === 'zh' ? '(我)' : '(Me)'}</span>}</div>
                  <div className="podium-count">{topThree[1].checkinCount}{language === 'zh' ? '次' : 'x'}</div>
                </div>
              </div>
            )}

            {/* 第1名 - 中间 */}
            {topThree[0] && (
              <div className="podium-item rank-1">
                <div className="crown-icon">👑</div>
                {renderAvatar(topThree[0])}
                <div
                  className="podium-bar"
                  style={{ height: `${getBarHeight(topThree[0].checkinCount)}px` }}
                >
                  <span className="bar-rank">1</span>
                </div>
                <div className="podium-info">
                  <div className="podium-name">{topThree[0].userName}{currentUserId && topThree[0].userId === currentUserId && <span className="is-me-tag">{language === 'zh' ? '(我)' : '(Me)'}</span>}</div>
                  <div className="podium-count">{topThree[0].checkinCount}{language === 'zh' ? '次' : 'x'}</div>
                </div>
              </div>
            )}

            {/* 第3名 - 右侧 */}
            {topThree[2] && (
              <div className="podium-item rank-3">
                {renderAvatar(topThree[2])}
                <div
                  className="podium-bar"
                  style={{ height: `${getBarHeight(topThree[2].checkinCount)}px` }}
                >
                  <span className="bar-rank">3</span>
                </div>
                <div className="podium-info">
                  <div className="podium-name">{topThree[2].userName}{currentUserId && topThree[2].userId === currentUserId && <span className="is-me-tag">{language === 'zh' ? '(我)' : '(Me)'}</span>}</div>
                  <div className="podium-count">{topThree[2].checkinCount}{language === 'zh' ? '次' : 'x'}</div>
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
                <img src={item.userAvatar ? convertCloudUrl(item.userAvatar) : DEFAULT_AVATAR} alt="" className="rank-avatar-img" onError={handleImgError} />
              </div>
              <span className="rank-name">{item.userName}{currentUserId && item.userId === currentUserId && <span className="is-me-tag">{language === 'zh' ? '(我)' : '(Me)'}</span>}</span>
              <span className="rank-count">{item.checkinCount}{language === 'zh' ? '次' : 'x'}</span>
            </div>
          ))}
        </div>
      )}

      {/* 我的排名 (10+1) */}
      {!loading && myRankInfo && (
        <div className="my-rank-section">
          <div className="rank-list-item my-rank-row">
            {myRankInfo.inTop10 ? (
              <span className="rank-num">#{myRankInfo.rank}</span>
            ) : (
              <span className="rank-num unranked">{language === 'zh' ? '未上榜' : 'N/A'}</span>
            )}
            <div className="rank-avatar">
              <img src={myRankInfo.userAvatar ? convertCloudUrl(myRankInfo.userAvatar) : DEFAULT_AVATAR} alt="" className="rank-avatar-img" onError={handleImgError} />
            </div>
            <span className="rank-name">{myRankInfo.userName}<span className="is-me-tag">{language === 'zh' ? '(我)' : '(Me)'}</span></span>
            <span className="rank-count">{myRankInfo.checkinCount}{language === 'zh' ? '次' : 'x'}</span>
          </div>
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
