/**
 * 云存储图片获取测试页面
 * Test page for CloudBase cloud storage image access
 */

import { useState, useEffect } from 'react'
import { initDatabase } from '../../services/databaseService'
import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'cloud1-6gnd02he13c1ff2e'

// 测试用的云存储文件 ID
const TEST_FILE_IDS = [
  'cloud://cloud1-6gnd02he13c1ff2e.636c-cloud1-6gnd02he13c1ff2e-1380655578/card/9b5f7bed69097761003d7d5d7ca7b602/1762273980370_746495.jpg',
  'cloud://cloud1-6gnd02he13c1ff2e.636c-cloud1-6gnd02he13c1ff2e-1380655578/carousel/1762456450658_515106.jpg',
  'cloud://cloud1-6gnd02he13c1ff2e.636c-cloud1-6gnd02he13c1ff2e-1380655578/carousel/1762456552805_379058.jpg',
]

export default function CloudStorageTest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [logs, setLogs] = useState([])

  const addLog = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { msg, type, timestamp }])
    console.log(`[${type}] ${msg}`)
  }

  // 方法1: 使用 CloudBase SDK getTempFileURL
  const testMethod1 = async () => {
    addLog('尝试方法1: CloudBase SDK getTempFileURL')
    try {
      await initDatabase()
      const app = cloudbase.init({ env: ENV_ID })

      addLog('CloudBase 初始化成功，开始获取临时 URL...')

      const result = await app.getTempFileURL({
        fileList: TEST_FILE_IDS
      })

      addLog(`获取结果: ${JSON.stringify(result)}`, 'success')
      return result.fileList || []
    } catch (err) {
      addLog(`方法1失败: ${err.message}`, 'error')
      return null
    }
  }

  // 方法2: 直接拼接 HTTP URL (某些环境可用)
  const testMethod2 = () => {
    addLog('尝试方法2: 直接拼接 HTTP URL')
    try {
      const httpUrls = TEST_FILE_IDS.map(cloudUrl => {
        // cloud://env-id.xxx-xxx/path -> https://xxx.tcb.qcloud.la/path
        const match = cloudUrl.match(/cloud:\/\/([^.]+)\.([^/]+)\/(.+)/)
        if (match) {
          const [, envId, region, path] = match
          // 尝试多种可能的 URL 格式
          const urls = [
            `https://${region}.tcb.qcloud.la/${path}`,
            `https://${envId}-${region}.tcloudbaseapp.com/${path}`,
            `https://${region}-1380655578.cos.ap-shanghai.myqcloud.com/${path}`,
          ]
          return { cloudUrl, urls }
        }
        return { cloudUrl, urls: [] }
      })

      addLog(`生成的 HTTP URLs: ${JSON.stringify(httpUrls, null, 2)}`)
      return httpUrls
    } catch (err) {
      addLog(`方法2失败: ${err.message}`, 'error')
      return null
    }
  }

  // 方法3: 调用云函数获取临时 URL
  const testMethod3 = async () => {
    addLog('尝试方法3: 调用云函数获取临时 URL')
    try {
      await initDatabase()
      const app = cloudbase.init({ env: ENV_ID })

      const result = await app.callFunction({
        name: 'cloud',
        data: {
          route: 'home/get_file_url',
          fileList: TEST_FILE_IDS
        }
      })

      addLog(`云函数返回: ${JSON.stringify(result)}`, 'success')
      return result.result
    } catch (err) {
      addLog(`方法3失败: ${err.message}`, 'error')
      return null
    }
  }

  // 方法4: 使用 HTTP API 获取
  const testMethod4 = async () => {
    addLog('尝试方法4: HTTP API 获取')
    try {
      const response = await fetch(`https://${ENV_ID}.ap-shanghai.app.tcloudbase.com/cloud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'home/get_file_url',
          fileList: TEST_FILE_IDS
        })
      })

      const data = await response.json()
      addLog(`HTTP API 返回: ${JSON.stringify(data)}`, 'success')
      return data
    } catch (err) {
      addLog(`方法4失败: ${err.message}`, 'error')
      return null
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setError(null)
    setResults([])
    setLogs([])

    addLog('开始测试云存储图片获取...')

    // 测试方法1
    const result1 = await testMethod1()
    if (result1 && result1.length > 0) {
      setResults(result1.map(item => ({
        fileId: item.fileID,
        url: item.tempFileURL,
        method: 'SDK getTempFileURL'
      })))
      addLog('方法1成功！', 'success')
      setLoading(false)
      return
    }

    // 测试方法2
    const result2 = testMethod2()
    if (result2) {
      // 尝试加载第一个 URL 看是否可用
      for (const item of result2) {
        for (const url of item.urls) {
          try {
            addLog(`尝试加载: ${url}`)
            const response = await fetch(url, { method: 'HEAD' })
            if (response.ok) {
              addLog(`URL 可用: ${url}`, 'success')
              setResults(result2.map(r => ({
                fileId: r.cloudUrl,
                url: r.urls[0],
                method: '直接拼接 HTTP URL'
              })))
              setLoading(false)
              return
            }
          } catch {
            addLog(`URL 不可用: ${url}`, 'warn')
          }
        }
      }
    }

    // 测试方法3
    const result3 = await testMethod3()
    if (result3 && result3.data) {
      setResults(result3.data.map(item => ({
        fileId: item.fileID,
        url: item.tempFileURL,
        method: '云函数 get_file_url'
      })))
      addLog('方法3成功！', 'success')
      setLoading(false)
      return
    }

    // 测试方法4
    const result4 = await testMethod4()
    if (result4 && result4.data) {
      setResults(result4.data.map(item => ({
        fileId: item.fileID,
        url: item.tempFileURL,
        method: 'HTTP API'
      })))
      addLog('方法4成功！', 'success')
      setLoading(false)
      return
    }

    setError('所有方法都失败了，请查看日志了解详情')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)',
      padding: '100px 20px 40px',
      color: 'white'
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 8,
          background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          云存储图片获取测试
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
          测试从腾讯云 CloudBase 云存储获取图片
        </p>

        <button
          onClick={runAllTests}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? 'gray' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 24
          }}
        >
          {loading ? '测试中...' : '开始测试'}
        </button>

        {/* 测试结果 */}
        {results.length > 0 && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24
          }}>
            <h3 style={{ color: '#22c55e', marginBottom: 16 }}>测试成功！获取到 {results.length} 张图片</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {results.map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  padding: 16
                }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    方法: {item.method}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, wordBreak: 'break-all' }}>
                    FileID: {item.fileId}
                  </p>
                  <p style={{ fontSize: 12, color: '#06b6d4', marginBottom: 12, wordBreak: 'break-all' }}>
                    URL: {item.url}
                  </p>
                  {item.url && (
                    <img
                      src={item.url}
                      alt={`测试图片 ${idx + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        addLog(`图片加载失败: ${item.url}`, 'error')
                      }}
                      onLoad={() => addLog(`图片加载成功: ${item.url}`, 'success')}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        {/* 日志 */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 12,
          padding: 20
        }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>测试日志</h3>
          <div style={{
            maxHeight: 400,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: 13
          }}>
            {logs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>点击"开始测试"查看日志</p>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: log.type === 'error' ? '#ef4444'
                         : log.type === 'success' ? '#22c55e'
                         : log.type === 'warn' ? '#f59e0b'
                         : 'rgba(255,255,255,0.7)'
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>[{log.timestamp}]</span>
                  {log.msg}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 测试文件列表 */}
        <div style={{ marginTop: 24, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          <h4 style={{ marginBottom: 8 }}>测试文件:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {TEST_FILE_IDS.map((id, idx) => (
              <li key={idx} style={{ marginBottom: 4, wordBreak: 'break-all' }}>
                {idx + 1}. {id}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
