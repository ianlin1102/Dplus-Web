/**
 * 云函数 HTTP 访问测试页面
 * 测试通过 HTTP 触发器调用云函数
 */

import { useState } from 'react'
import { getRankListHTTP, callCloudRouteHTTP } from '../../services/httpApi'
import './CloudTest.css'

export default function CloudFunctionTest() {
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [httpUrl, setHttpUrl] = useState(
    'https://cloud1-6gnd02he13c1ff2e-1380655578.service.tcloudbase.com/cloud'
  )

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

  // 测试 1: 直接调用 HTTP 接口
  const handleTestDirectHTTP = async () => {
    if (!httpUrl) {
      addResult('❌ 请先输入 HTTP 访问地址', 'error')
      return
    }

    setLoading(true)
    addResult('🔄 测试直接 HTTP 调用...', 'info')

    try {
      const response = await fetch(httpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'checkin/rank_list',
          type: 'all',
          limit: 5
        })
      })

      addResult(`   HTTP 状态码: ${response.status} ${response.statusText}`, 'info')

      const text = await response.text()
      addResult(`   原始响应: ${text.substring(0, 200)}...`, 'info')

      const result = JSON.parse(text)

      if (result && result.code === 0) {
        addResult('✅ 云函数调用成功!', 'success')
        const rankList = result.data || []
        addResult(`   获取到 ${rankList.length} 条排行数据`, 'success')

        rankList.forEach((item, index) => {
          addResult(`   ${index + 1}. ${item.userName} - ${item.checkinCount} 次`, 'success')
        })
      } else if (result && result.code) {
        addResult(`⚠️ 云函数返回错误码: ${result.code}`, 'warning')
        addResult(`   错误信息: ${result.msg || '未知错误'}`, 'warning')
      } else {
        addResult('⚠️ 云函数返回格式异常', 'warning')
        addResult(`   返回内容: ${JSON.stringify(result)}`, 'warning')
      }

    } catch (error) {
      addResult('❌ HTTP 调用失败: ' + error.message, 'error')

      if (error.message.includes('Failed to fetch')) {
        addResult('', 'warning')
        addResult('💡 可能的原因：', 'warning')
        addResult('   1. HTTP 触发器未创建', 'warning')
        addResult('   2. HTTP 访问地址不正确', 'warning')
        addResult('   3. 云函数未部署或已停用', 'warning')
        addResult('   4. CORS 跨域问题', 'warning')
      }
    } finally {
      setLoading(false)
    }
  }

  // 测试 2: 使用封装的 API
  const handleTestAPI = async () => {
    setLoading(true)
    addResult('🔄 测试封装的 API 调用...', 'info')

    try {
      const rankList = await getRankListHTTP('all', 5)
      addResult('✅ API 调用成功!', 'success')
      addResult(`   获取到 ${rankList.length} 条排行数据`, 'success')

      rankList.forEach((item, index) => {
        addResult(`   ${index + 1}. ${item.userName} - ${item.checkinCount} 次`, 'success')
      })
    } catch (error) {
      addResult('❌ API 调用失败: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 测试 3: 测试其他路由
  const handleTestOtherRoute = async () => {
    setLoading(true)
    addResult('🔄 测试 home/setup_all 路由...', 'info')

    try {
      const result = await callCloudRouteHTTP('home/setup_all')
      addResult('✅ 路由调用成功!', 'success')
      addResult(`   返回数据: ${JSON.stringify(result).substring(0, 100)}...`, 'success')
    } catch (error) {
      addResult('❌ 路由调用失败: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cloud-test">
      <div className="test-header">
        <h1>🌐 云函数 HTTP 访问测试</h1>
        <p className="subtitle">测试通过 HTTP 触发器调用云函数</p>
      </div>

      <div className="test-controls">
        <h2>配置 HTTP 访问地址</h2>

        <div className="url-config">
          <input
            type="text"
            value={httpUrl}
            onChange={(e) => setHttpUrl(e.target.value)}
            placeholder="请输入云函数 HTTP 访问地址"
            className="url-input"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(httpUrl)
              addResult('✅ 地址已复制到剪贴板', 'success')
            }}
            className="btn-secondary"
          >
            复制地址
          </button>
        </div>

        <div className="test-info">
          <h3>如何获取 HTTP 访问地址？</h3>
          <ol>
            <li>访问：<a href="https://console.cloud.tencent.com/tcb/scf/index?envId=cloud1-6gnd02he13c1ff2e" target="_blank" rel="noopener noreferrer">云开发控制台</a></li>
            <li>点击左侧 <strong>云函数</strong></li>
            <li>找到并点击 <strong>cloud</strong> 函数</li>
            <li>点击 <strong>触发方式</strong> 标签</li>
            <li>如果没有 HTTP 触发器，点击 <strong>添加触发器</strong></li>
            <li>选择 <strong>HTTP 触发</strong>，提交后复制访问路径</li>
          </ol>
        </div>

        <h2>测试操作</h2>

        <div className="button-group">
          <button
            onClick={handleTestDirectHTTP}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '测试中...' : '1. 直接 HTTP 调用'}
          </button>

          <button
            onClick={handleTestAPI}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '测试中...' : '2. 封装 API 调用'}
          </button>

          <button
            onClick={handleTestOtherRoute}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '测试中...' : '3. 测试其他路由'}
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
              配置 HTTP 访问地址后，点击上方按钮开始测试...
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
        <h3>常见问题</h3>
        <div className="next-steps">
          <div className="step">
            <strong>❌ 404 Not Found</strong>
            <p>HTTP 触发器未创建，或访问地址不正确</p>
          </div>
          <div className="step">
            <strong>❌ CORS 错误</strong>
            <p>需要在云函数中配置 CORS 响应头</p>
          </div>
          <div className="step">
            <strong>❌ 500 服务器繁忙</strong>
            <p>云函数代码错误，查看云函数日志</p>
          </div>
          <div className="step">
            <strong>✅ 测试成功</strong>
            <p>可以在实际页面中使用 httpApi.js 调用云函数了</p>
          </div>
        </div>
      </div>
    </div>
  )
}
