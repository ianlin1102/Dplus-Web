/**
 * CloudImage - 云存储图片组件
 * 自动处理 cloud:// URL 的临时下载链接获取
 * 当图片无法加载时，显示带有首字母的占位符
 */

import React, { useState, useEffect } from 'react'
import { getTempDownloadUrl, convertCloudUrl } from '../utils/cloudUrlHelper'

const CloudImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  onLoad,
  onError,
  fallback = null, // 加载失败时显示的内容
  placeholder = null, // 加载中显示的内容
  fallbackText = '', // 加载失败时显示的文字（如姓名首字母）
  ...props
}) => {
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadImage = async () => {
      if (!src) {
        setLoading(false)
        setError(true)
        return
      }

      // 如果已经是 http/https URL，直接使用
      if (src.startsWith('http://') || src.startsWith('https://')) {
        setImageUrl(src)
        setLoading(false)
        return
      }

      // 如果是 cloud:// URL
      if (src.startsWith('cloud://')) {
        // 首先尝试获取临时下载链接
        try {
          const tempUrl = await getTempDownloadUrl(src)
          if (isMounted) {
            // 如果返回的仍然是 cloud:// URL，使用同步转换作为备用
            if (tempUrl.startsWith('cloud://')) {
              const fallbackUrl = convertCloudUrl(src)
              if (!fallbackUrl.startsWith('cloud://')) {
                setImageUrl(fallbackUrl)
                setLoading(false)
              } else {
                setError(true)
                setLoading(false)
              }
            } else {
              setImageUrl(tempUrl)
              setLoading(false)
            }
          }
        } catch (err) {
          console.warn('获取图片临时 URL 失败，尝试备用方案:', err.message)
          if (isMounted) {
            // 尝试直接转换
            const fallbackUrl = convertCloudUrl(src)
            if (!fallbackUrl.startsWith('cloud://')) {
              setImageUrl(fallbackUrl)
              setLoading(false)
            } else {
              setError(true)
              setLoading(false)
            }
          }
        }
      } else {
        // 其他格式，直接使用
        setImageUrl(src)
        setLoading(false)
      }
    }

    setLoading(true)
    setError(false)
    loadImage()

    return () => {
      isMounted = false
    }
  }, [src, retryCount])

  const handleLoad = (e) => {
    if (onLoad) onLoad(e)
  }

  const handleError = (e) => {
    // 图片加载失败（可能是403等）
    setError(true)
    if (onError) onError(e)
  }

  // 获取显示的占位符文字
  const getPlaceholderText = () => {
    if (fallbackText) {
      return fallbackText.charAt(0).toUpperCase()
    }
    if (alt) {
      return alt.charAt(0).toUpperCase()
    }
    return '?'
  }

  // 生成基于文字的背景色
  const getPlaceholderColor = () => {
    const text = fallbackText || alt || ''
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ]
    const index = text.charCodeAt(0) % colors.length
    return colors[index]
  }

  // 加载中
  if (loading) {
    if (placeholder) {
      return placeholder
    }
    return (
      <div
        className={`cloud-image-placeholder ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(128, 128, 128, 0.1)',
          borderRadius: 'inherit',
          ...style
        }}
      >
        <span style={{ fontSize: '12px', color: '#999' }}>...</span>
      </div>
    )
  }

  // 加载失败 - 显示自定义 fallback 或带首字母的占位符
  if (error || !imageUrl) {
    if (fallback) {
      return fallback
    }
    return (
      <div
        className={`cloud-image-fallback ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: getPlaceholderColor(),
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.2em',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          borderRadius: 'inherit',
          ...style
        }}
      >
        {getPlaceholderText()}
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  )
}

export default CloudImage
