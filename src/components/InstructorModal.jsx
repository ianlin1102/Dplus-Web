import React from 'react'
import './InstructorModal.css'

const InstructorModal = ({ instructor, isOpen, onClose }) => {
  if (!isOpen || !instructor) return null

  // 点击背景关闭弹窗
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // 截断简介文本
  const truncateDesc = (desc, maxLength = 200) => {
    if (!desc) return '暂无介绍'
    return desc.length > maxLength ? desc.substring(0, maxLength) + '...' : desc
  }

  return (
    <div className="instructor-modal-backdrop" onClick={handleBackdropClick}>
      <div className="instructor-modal">
        {/* 关闭按钮 */}
        <button className="instructor-modal__close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 头像 */}
        <div className="instructor-modal__avatar">
          {instructor.INSTRUCTOR_NAME ? instructor.INSTRUCTOR_NAME[0] : '?'}
        </div>

        {/* 导师信息 */}
        <div className="instructor-modal__info">
          <h2 className="instructor-modal__name">{instructor.INSTRUCTOR_NAME}</h2>
          <p className="instructor-modal__desc">
            {truncateDesc(instructor.INSTRUCTOR_DESC)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default InstructorModal
