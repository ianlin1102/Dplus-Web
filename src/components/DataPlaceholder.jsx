import React from 'react'
import './DataPlaceholder.css'

/**
 * 通用数据 Placeholder 组件
 * @param {Object} props
 * @param {string} props.type - 类型: 'instructor' | 'ranking' | 'card' | 'list'
 * @param {number} props.count - 显示多少个 placeholder，默认 3
 * @param {string} props.message - 自定义提示消息
 * @param {number} props.retryCount - 当前重试次数
 * @param {number} props.nextRetryIn - 下次重试倒计时（秒）
 */
const DataPlaceholder = ({
  type = 'list',
  count = 3,
  message = '正在加载数据...',
  retryCount = 0,
  nextRetryIn = null
}) => {

  const renderInstructorPlaceholder = () => (
    <div className="instructor-placeholder">
      <div className="instructor-placeholder__avatar shimmer"></div>
      <div className="instructor-placeholder__content">
        <div className="instructor-placeholder__name shimmer"></div>
        <div className="instructor-placeholder__title shimmer"></div>
        <div className="instructor-placeholder__desc shimmer"></div>
      </div>
    </div>
  )

  const renderRankingPlaceholder = () => (
    <div className="ranking-placeholder">
      <div className="ranking-placeholder__avatar shimmer"></div>
      <div className="ranking-placeholder__info">
        <div className="ranking-placeholder__name shimmer"></div>
        <div className="ranking-placeholder__count shimmer"></div>
      </div>
    </div>
  )

  const renderCardPlaceholder = () => (
    <div className="card-placeholder">
      <div className="card-placeholder__image shimmer"></div>
      <div className="card-placeholder__content">
        <div className="card-placeholder__title shimmer"></div>
        <div className="card-placeholder__price shimmer"></div>
        <div className="card-placeholder__desc shimmer"></div>
      </div>
    </div>
  )

  const renderListPlaceholder = () => (
    <div className="list-placeholder">
      <div className="list-placeholder__line shimmer"></div>
      <div className="list-placeholder__line shimmer"></div>
      <div className="list-placeholder__line shimmer short"></div>
    </div>
  )

  const getPlaceholderRenderer = () => {
    switch (type) {
      case 'instructor':
        return renderInstructorPlaceholder
      case 'ranking':
        return renderRankingPlaceholder
      case 'card':
        return renderCardPlaceholder
      default:
        return renderListPlaceholder
    }
  }

  const renderer = getPlaceholderRenderer()

  return (
    <div className="data-placeholder-container">
      {/* Placeholder 项目 */}
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="data-placeholder-item">
          {renderer()}
        </div>
      ))}

      {/* 加载提示信息 */}
      <div className="data-placeholder-message">
        <div className="loading-spinner"></div>
        <p className="message-text">{message}</p>

        {retryCount > 0 && (
          <p className="retry-info">
            已重试 {retryCount} 次
            {nextRetryIn !== null && ` · ${nextRetryIn}秒后重试`}
          </p>
        )}
      </div>
    </div>
  )
}

export default DataPlaceholder
