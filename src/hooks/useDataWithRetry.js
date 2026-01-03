import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 通用的数据获取 Hook，支持自动重试和 Placeholder
 * @param {Function} fetchFunction - 数据获取函数
 * @param {Object} options - 配置选项
 * @param {number} options.retryInterval - 重试间隔（毫秒），默认 60000 (1分钟)
 * @param {boolean} options.enableRetry - 是否启用自动重试，默认 true
 * @param {number} options.maxRetries - 最大重试次数，默认无限制
 * @param {string} options.cacheKey - localStorage 缓存键
 * @param {number} options.cacheTTL - 缓存有效期（毫秒），默认 5 分钟
 * @returns {Object} { data, loading, error, retry, hasData }
 */
export const useDataWithRetry = (fetchFunction, options = {}) => {
  const {
    retryInterval = 60000, // 1分钟
    enableRetry = true,
    maxRetries = Infinity,
    cacheKey = null,
    cacheTTL = 5 * 60 * 1000 // 5分钟
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const timerRef = useRef(null)
  const isMountedRef = useRef(true)

  // 从 localStorage 加载缓存
  const loadFromCache = useCallback(() => {
    if (!cacheKey) return null

    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp

        if (age < cacheTTL) {
          console.log(`从缓存加载数据: ${cacheKey}, 缓存年龄: ${Math.round(age / 1000)}秒`)
          return cachedData
        } else {
          console.log(`缓存已过期: ${cacheKey}`)
          localStorage.removeItem(cacheKey)
        }
      }
    } catch (err) {
      console.error('加载缓存失败:', err)
    }

    return null
  }, [cacheKey, cacheTTL])

  // 保存到 localStorage
  const saveToCache = useCallback((dataToCache) => {
    if (!cacheKey || !dataToCache) return

    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: dataToCache,
        timestamp: Date.now()
      }))
      console.log(`数据已缓存: ${cacheKey}`)
    } catch (err) {
      console.error('保存缓存失败:', err)
    }
  }, [cacheKey])

  // 检查数据是否为空
  const hasData = useCallback((dataToCheck) => {
    if (!dataToCheck) return false
    if (Array.isArray(dataToCheck)) return dataToCheck.length > 0
    if (typeof dataToCheck === 'object') return Object.keys(dataToCheck).length > 0
    return true
  }, [])

  // 数据获取函数
  const fetchData = useCallback(async (isRetry = false) => {
    if (!isMountedRef.current) return

    try {
      if (isRetry) {
        console.log(`重试获取数据 (第 ${retryCount + 1} 次)...`)
      } else {
        setLoading(true)
      }

      setError(null)

      const result = await fetchFunction()

      if (!isMountedRef.current) return

      // 检查返回的数据
      let actualData = result

      // 如果返回格式是 {code: 200, data: {...}}
      if (result && result.code === 200 && result.data !== undefined) {
        actualData = result.data
      }

      // 如果 data 中有 list 字段，优先使用 list
      if (actualData && actualData.list !== undefined) {
        actualData = actualData.list
      }

      setData(actualData)
      setRetryCount(0) // 成功后重置重试计数

      // 如果数据不为空，保存到缓存
      if (hasData(actualData)) {
        saveToCache(actualData)
      } else {
        console.warn('获取的数据为空，将在 1 分钟后重试')
        // 数据为空时，安排重试
        if (enableRetry && retryCount < maxRetries) {
          timerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setRetryCount(prev => prev + 1)
              fetchData(true)
            }
          }, retryInterval)
        }
      }

    } catch (err) {
      console.error('数据获取失败:', err)

      if (!isMountedRef.current) return

      setError(err.message || '数据获取失败')

      // 失败时，安排重试
      if (enableRetry && retryCount < maxRetries) {
        timerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setRetryCount(prev => prev + 1)
            fetchData(true)
          }
        }, retryInterval)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [fetchFunction, retryCount, maxRetries, retryInterval, enableRetry, hasData, saveToCache])

  // 手动重试函数
  const retry = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setRetryCount(0)
    fetchData(false)
  }, [fetchData])

  // 初始化：先尝试加载缓存，再获取数据
  useEffect(() => {
    isMountedRef.current = true

    // 先尝试从缓存加载
    const cachedData = loadFromCache()
    if (cachedData && hasData(cachedData)) {
      setData(cachedData)
      setLoading(false)
      console.log('使用缓存数据')
    }

    // 无论是否有缓存，都获取最新数据
    fetchData(false)

    return () => {
      isMountedRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, []) // 只在组件挂载时执行一次

  return {
    data,
    loading,
    error,
    retry,
    hasData: hasData(data),
    retryCount
  }
}

export default useDataWithRetry
