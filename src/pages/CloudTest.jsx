/**
 * 云数据库访问测试页面
 * 测试静态托管是否能直接访问微信云数据库
 */

import { useState, useEffect } from 'react'
import cloudbase from '@cloudbase/js-sdk'
import './CloudTest.css'

const ENV_ID = 'cloud1-6gnd02he13c1ff2e'

export default function CloudTest() {
  const [app, setApp] = useState(null)
  const [loginStatus, setLoginStatus] = useState('未登录')
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initCloudBase()
  }, [])

  // 初始化 CloudBase
  const initCloudBase = () => {
    try {
      const cloudApp = cloudbase.init({
        env: ENV_ID
      })
      setApp(cloudApp)
      addResult('✅ CloudBase SDK 初始化成功', 'success')
      checkLoginStatus(cloudApp)
    } catch (error) {
      addResult('❌ CloudBase SDK 初始化失败: ' + error.message, 'error')
    }
  }

  // 检查登录状态
  const checkLoginStatus = async (cloudApp) => {
    try {
      const auth = cloudApp.auth({ persistence: 'local' })
      const loginState = await auth.getLoginState()

      if (loginState) {
        setLoginStatus('已登录 (匿名)')
        addResult('✅ 已有登录状态', 'success')
      } else {
        setLoginStatus('未登录')
        addResult('⚠️ 未登录，需要先登录', 'warning')
      }
    } catch (error) {
      addResult('❌ 检查登录状态失败: ' + error.message, 'error')
    }
  }

  // 匿名登录
  const handleAnonymousLogin = async () => {
    if (!app) {
      addResult('❌ CloudBase 未初始化', 'error')
      return
    }

    setLoading(true)
    addResult('🔄 开始匿名登录...', 'info')

    try {
      const auth = app.auth({ persistence: 'local' })
      await auth.anonymousAuthProvider().signIn()

      const loginState = await auth.getLoginState()

      if (loginState) {
        setLoginStatus('已登录 (匿名)')
        addResult('✅ 匿名登录成功!', 'success')
        addResult(`   用户 ID: ${loginState.user.uid}`, 'info')
      }
    } catch (error) {
      addResult('❌ 匿名登录失败: ' + error.message, 'error')
      addResult(`   错误详情: ${JSON.stringify(error)}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 测试读取数据库
  const handleTestDatabase = async () => {
    if (!app) {
      addResult('❌ CloudBase 未初始化', 'error')
      return
    }

    setLoading(true)
    addResult('🔄 开始测试数据库访问...', 'info')

    try {
      const db = app.database()

      // 测试 1: 读取排行榜数据
      addResult('📊 测试 1: 读取排行榜数据 (ax_join)', 'info')

      const result = await db.collection('ax_join')
        .where({
          _pid: 'A00',
          JOIN_IS_CHECKIN: 1
        })
        .orderBy('_id', 'desc')
        .limit(5)
        .get()

      if (result.data && result.data.length > 0) {
        addResult(`✅ 读取成功! 找到 ${result.data.length} 条签到记录`, 'success')
        result.data.forEach((item, index) => {
          addResult(`   ${index + 1}. 用户: ${item.JOIN_USER_NAME || '未知'}`, 'success')
        })
      } else {
        addResult('⚠️ 查询成功但没有数据', 'warning')
      }

      // 测试 2: 读取用户数据
      addResult('👥 测试 2: 读取用户数据 (ax_user)', 'info')

      const userResult = await db.collection('ax_user')
        .where({ _pid: 'A00' })
        .limit(3)
        .get()

      if (userResult.data && userResult.data.length > 0) {
        addResult(`✅ 读取成功! 找到 ${userResult.data.length} 个用户`, 'success')
      } else {
        addResult('⚠️ 查询成功但没有用户数据', 'warning')
      }

      // 测试 3: 读取课程数据
      addResult('📚 测试 3: 读取课程数据 (ax_meet)', 'info')

      const meetResult = await db.collection('ax_meet')
        .where({
          _pid: 'A00',
          MEET_STATUS: 1  // 进行中的课程
        })
        .limit(3)
        .get()

      if (meetResult.data && meetResult.data.length > 0) {
        addResult(`✅ 读取成功! 找到 ${meetResult.data.length} 个课程`, 'success')
        meetResult.data.forEach((item, index) => {
          addResult(`   ${index + 1}. ${item.MEET_TITLE || '未命名课程'}`, 'success')
        })
      } else {
        addResult('⚠️ 查询成功但没有课程数据', 'warning')
      }

    } catch (error) {
      addResult('❌ 数据库访问失败: ' + error.message, 'error')
      addResult(`   错误代码: ${error.code || '未知'}`, 'error')
      addResult(`   错误详情: ${JSON.stringify(error)}`, 'error')

      // 分析错误原因
      if (error.code === 'DATABASE_PERMISSION_DENIED') {
        addResult('💡 原因分析: 数据库权限不足', 'warning')
        addResult('   解决方案: 需要在云控制台配置 Web 安全域名', 'warning')
      } else if (error.code === 'INVALID_PARAM') {
        addResult('💡 原因分析: 参数错误或集合不存在', 'warning')
      }
    } finally {
      setLoading(false)
    }
  }

  // 测试调用云函数
  const handleTestCloudFunction = async () => {
    if (!app) {
      addResult('❌ CloudBase 未初始化', 'error')
      return
    }

    setLoading(true)
    addResult('🔄 开始测试云函数调用...', 'info')

    try {
      // 方法 1: 调用已有的云函数
      addResult('📡 方法 1: 调用 checkin/rank_list 路由', 'info')

      const result = await app.callFunction({
        name: 'cloud',
        data: {
          route: 'checkin/rank_list',
          type: 'all',
          limit: 5
        }
      })

      addResult(`   原始返回: ${JSON.stringify(result)}`, 'info')

      if (result.result && result.result.code === 0) {
        addResult('✅ 云函数调用成功!', 'success')
        const rankList = result.result.data || []
        addResult(`   获取到 ${rankList.length} 条排行数据`, 'success')

        rankList.forEach((item, index) => {
          addResult(`   ${index + 1}. ${item.userName} - ${item.checkinCount} 次`, 'success')
        })
      } else if (result.result) {
        addResult(`⚠️ 云函数返回错误码: ${result.result.code}`, 'warning')
        addResult(`   错误信息: ${result.result.msg || '未知错误'}`, 'warning')
      } else {
        addResult('⚠️ 云函数返回格式异常', 'warning')
      }

      // 方法 2: 尝试更简单的路由
      addResult('', 'info')
      addResult('📡 方法 2: 尝试调用 home/setup_all 路由', 'info')

      const setupResult = await app.callFunction({
        name: 'cloud',
        data: {
          route: 'home/setup_all'
        }
      })

      if (setupResult.result && setupResult.result.code === 0) {
        addResult('✅ home/setup_all 调用成功!', 'success')
        addResult(`   返回数据: ${JSON.stringify(setupResult.result.data).substring(0, 100)}...`, 'success')
      } else {
        addResult('⚠️ home/setup_all 调用失败', 'warning')
        addResult(`   返回: ${JSON.stringify(setupResult)}`, 'warning')
      }

    } catch (error) {
      addResult('❌ 云函数调用失败: ' + error.message, 'error')
      addResult(`   错误代码: ${error.code || '未知'}`, 'error')
      addResult(`   错误详情: ${JSON.stringify(error)}`, 'error')

      // 分析常见错误
      if (error.message.includes('繁忙') || error.message.includes('busy')) {
        addResult('', 'warning')
        addResult('💡 可能的原因：', 'warning')
        addResult('   1. 云函数配置问题（Web 端调用权限）', 'warning')
        addResult('   2. 云函数代码错误', 'warning')
        addResult('   3. 环境 ID 配置错误', 'warning')
        addResult('', 'warning')
        addResult('💡 好消息：数据库访问成功，可以不依赖云函数！', 'success')
      }
    } finally {
      setLoading(false)
    }
  }

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
  }

  return (
    <div className="cloud-test">
      <div className="test-header">
        <h1>☁️ 云数据库访问测试</h1>
        <p className="subtitle">测试静态托管是否能访问微信云开发</p>
        <div className="env-info">
          <span>环境 ID: {ENV_ID}</span>
          <span className={`status ${loginStatus.includes('已登录') ? 'online' : 'offline'}`}>
            {loginStatus}
          </span>
        </div>
      </div>

      <div className="test-controls">
        <h2>测试操作</h2>

        <div className="button-group">
          <button
            onClick={handleAnonymousLogin}
            disabled={loading || loginStatus.includes('已登录')}
            className="btn-primary"
          >
            {loading ? '登录中...' : '1. 匿名登录'}
          </button>

          <button
            onClick={handleTestDatabase}
            disabled={loading || !loginStatus.includes('已登录')}
            className="btn-primary"
          >
            {loading ? '测试中...' : '2. 测试数据库访问'}
          </button>

          <button
            onClick={handleTestCloudFunction}
            disabled={loading || !loginStatus.includes('已登录')}
            className="btn-primary"
          >
            {loading ? '测试中...' : '3. 测试云函数调用'}
          </button>

          <button
            onClick={clearResults}
            disabled={loading || testResults.length === 0}
            className="btn-secondary"
          >
            清空日志
          </button>
        </div>

        <div className="test-info">
          <h3>测试步骤说明</h3>
          <ol>
            <li><strong>匿名登录</strong> - 获取访问权限（必须）</li>
            <li><strong>测试数据库</strong> - 尝试读取 ax_join, ax_user, ax_meet 集合</li>
            <li><strong>测试云函数</strong> - 调用 checkin/rank_list 云函数</li>
          </ol>

          <div className="expected-results">
            <h4>预期结果</h4>
            <ul>
              <li>✅ <strong>成功</strong>: 静态托管可以访问云数据库，无需配置 Web 安全域名</li>
              <li>❌ <strong>失败</strong>: 提示权限错误，需要配置 Web 安全域名或使用 HTTP 触发器方案</li>
            </ul>
          </div>
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
              点击上方按钮开始测试...
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

      <div className="test-footer">
        <h3>下一步</h3>
        <div className="next-steps">
          <div className="step">
            <strong>如果测试成功 ✅</strong>
            <p>可以继续使用 CloudBase SDK 直接访问数据库，无需 HTTP 触发器</p>
          </div>
          <div className="step">
            <strong>如果测试失败 ❌</strong>
            <p>需要：</p>
            <ol>
              <li>方案 1: 配置 Web 安全域名（需要付费升级）</li>
              <li>方案 2: 使用 HTTP 触发器 + API Key（免费方案）</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
