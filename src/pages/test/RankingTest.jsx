import { useState, useEffect } from 'react'
import { getRankList, clearRankCache } from '../../services/api'
import { loginAnonymously, getLoginState } from '../../services/cloudbase'
import './RankingTest.css'

/**
 * 排行榜测试页面
 * 演示如何从 Web 端读取微信云数据
 */
function RankingTest() {
  const [rankList, setRankList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentType, setCurrentType] = useState('all') // 'all' 或 'month'
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginLoading, setLoginLoading] = useState(true)

  // 加载排行榜数据
  const loadRankData = async (type = 'all') => {
    setLoading(true)
    setError(null)

    try {
      const result = await getRankList(type, 10)

      if (result && result.list) {
        // 计算高度比例（与小程序端一致）
        const processedList = calculateBarHeights(result.list)
        setRankList(processedList)
      } else {
        setRankList([])
      }
    } catch (err) {
      console.error('加载排行榜失败:', err)
      setError(err.message || '加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 计算柱状图高度
  const calculateBarHeights = (list) => {
    if (!list || list.length === 0) return list

    const topThree = list.slice(0, 3)
    const maxCount = Math.max(...topThree.map(item => item.checkinCount || 0))

    if (maxCount === 0) {
      return topThree.map((item, index) => ({
        ...item,
        barHeight: index === 0 ? 160 : (index === 1 ? 120 : 90)
      }))
    }

    const MIN_HEIGHT = 60
    const MAX_HEIGHT = 280

    return topThree.map((item) => {
      const count = item.checkinCount || 0
      const barHeight = Math.round((count / maxCount) * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT)
      return {
        ...item,
        barHeight: barHeight
      }
    })
  }

  // 切换榜单类型
  const handleSwitchType = (type) => {
    setCurrentType(type)
    loadRankData(type)
  }

  // 刷新数据
  const handleRefresh = async () => {
    try {
      await clearRankCache()
      await loadRankData(currentType)
      alert('刷新成功！')
    } catch (err) {
      alert('刷新失败：' + err.message)
    }
  }

  // 检查登录状态
  const checkLoginStatus = async () => {
    setLoginLoading(true)
    try {
      const loginState = await getLoginState()
      setIsLoggedIn(!!loginState)
      return !!loginState
    } catch (err) {
      console.error('检查登录状态失败:', err)
      setIsLoggedIn(false)
      return false
    } finally {
      setLoginLoading(false)
    }
  }

  // 执行登录
  const handleLogin = async () => {
    setLoginLoading(true)
    setError(null)
    try {
      await loginAnonymously()
      setIsLoggedIn(true)
      alert('登录成功！现在可以读取数据了')
      // 登录成功后自动加载数据
      loadRankData(currentType)
    } catch (err) {
      console.error('登录失败:', err)
      setError('登录失败：' + err.message + '\n\n请检查：\n1. 云控制台是否已开启匿名登录\n2. Web安全域名是否已配置')
      setIsLoggedIn(false)
    } finally {
      setLoginLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    const init = async () => {
      const loggedIn = await checkLoginStatus()
      if (loggedIn) {
        loadRankData(currentType)
      }
    }
    init()
  }, [])

  return (
    <div className="ranking-test-page">
      <div className="test-header">
        <h1>上课排行榜测试</h1>
        <p>从微信云数据库读取排行榜数据</p>

        {/* 登录状态显示 */}
        <div className="login-status">
          {loginLoading ? (
            <span className="status-badge loading">🔄 检查登录状态...</span>
          ) : isLoggedIn ? (
            <span className="status-badge success">✓ 已登录 (匿名)</span>
          ) : (
            <span className="status-badge error">✗ 未登录</span>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="action-buttons">
          {!isLoggedIn && (
            <button onClick={handleLogin} disabled={loginLoading} className="btn-login">
              {loginLoading ? '登录中...' : '🔐 匿名登录'}
            </button>
          )}
          {isLoggedIn && (
            <button onClick={handleRefresh} disabled={loading} className="btn-refresh">
              {loading ? '⏳ 加载中...' : '🔄 刷新数据'}
            </button>
          )}
        </div>
      </div>

      {/* 未登录提示 */}
      {!isLoggedIn && !loginLoading && (
        <div className="login-hint">
          <h3>⚠️ 需要先登录才能访问云数据</h3>
          <p>点击上方「匿名登录」按钮进行登录</p>
          <div className="setup-hints">
            <h4>首次使用请确保：</h4>
            <ol>
              <li>已在云控制台开启「匿名登录」</li>
              <li>已添加 Web 安全域名（如：http://localhost:5173）</li>
              <li>查看 <code>CLOUDBASE_SETUP.md</code> 了解详细配置步骤</li>
            </ol>
          </div>
        </div>
      )}

      {/* 排行榜组件 */}
      {isLoggedIn && (
        <div className="rank-list-container">
          {/* 榜单标题和切换 */}
          <div className="rank-header">
            <div className="rank-title">上课排行榜</div>
            <div className="rank-tabs">
              <div
                className={`rank-tab ${currentType === 'all' ? 'active' : ''}`}
                onClick={() => handleSwitchType('all')}
              >
                总榜
              </div>
              <div
                className={`rank-tab ${currentType === 'month' ? 'active' : ''}`}
                onClick={() => handleSwitchType('month')}
              >
                月榜
              </div>
            </div>
          </div>

          {/* 加载状态 */}
          {loading && <div className="loading-state">⏳ 加载中...</div>}

          {/* 错误状态 */}
          {error && (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={() => loadRankData(currentType)}>重试</button>
            </div>
          )}

          {/* 领奖台 */}
          {!loading && !error && rankList.length > 0 && (
            <div className="podium-container">
              <div className="podium">
                {/* 第二名 */}
                {rankList[1] && (
                  <div className="podium-item rank-2">
                    <div className="podium-avatar">
                      <span className="avatar-text">
                        {rankList[1].userName?.substring(0, 2) || '??'}
                      </span>
                    </div>
                    <div className="podium-bar" style={{ height: `${rankList[1].barHeight}px` }}>
                      <span className="bar-rank">2</span>
                    </div>
                    <div className="podium-info">
                      <div className="podium-name">{rankList[1].userName || '未知'}</div>
                      <div className="podium-count">{rankList[1].checkinCount || 0}次</div>
                    </div>
                  </div>
                )}

                {/* 第一名 */}
                {rankList[0] && (
                  <div className="podium-item rank-1">
                    <div className="crown-icon">👑</div>
                    <div className="podium-avatar">
                      <span className="avatar-text">
                        {rankList[0].userName?.substring(0, 2) || '??'}
                      </span>
                    </div>
                    <div className="podium-bar" style={{ height: `${rankList[0].barHeight}px` }}>
                      <span className="bar-rank">1</span>
                    </div>
                    <div className="podium-info">
                      <div className="podium-name">{rankList[0].userName || '未知'}</div>
                      <div className="podium-count">{rankList[0].checkinCount || 0}次</div>
                    </div>
                  </div>
                )}

                {/* 第三名 */}
                {rankList[2] && (
                  <div className="podium-item rank-3">
                    <div className="podium-avatar">
                      <span className="avatar-text">
                        {rankList[2].userName?.substring(0, 2) || '??'}
                      </span>
                    </div>
                    <div className="podium-bar" style={{ height: `${rankList[2].barHeight}px` }}>
                      <span className="bar-rank">3</span>
                    </div>
                    <div className="podium-info">
                      <div className="podium-name">{rankList[2].userName || '未知'}</div>
                      <div className="podium-count">{rankList[2].checkinCount || 0}次</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !error && rankList.length === 0 && (
            <div className="rank-empty">
              <span className="empty-icon">🏆</span>
              <span className="empty-text">暂无排行数据</span>
            </div>
          )}
        </div>
      )}

      {/* 调试信息 */}
      {isLoggedIn && rankList.length > 0 && (
        <div className="debug-info">
          <h3>📊 调试信息</h3>
          <pre>{JSON.stringify(rankList, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default RankingTest
