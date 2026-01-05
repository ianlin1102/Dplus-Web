import React from 'react'
import './InstructorCard.css'

const InstructorCard = ({ instructor, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(instructor)
    }
  }

  // 截断简介文本
  const truncateDesc = (desc, maxLength = 100) => {
    if (!desc) return ''
    return desc.length > maxLength ? desc.substring(0, maxLength) + '...' : desc
  }

  return (
    <div className="instructor-card" onClick={handleClick}>
      <div className="instructor-card__avatar">
        {instructor.INSTRUCTOR_PIC ? (
          <img
            src={instructor.INSTRUCTOR_PIC}
            alt={instructor.INSTRUCTOR_NAME}
            onError={(e) => {
              // 图片加载失败时显示占位符
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="instructor-card__placeholder"
          style={{
            display: instructor.INSTRUCTOR_PIC ? 'none' : 'flex',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '2rem',
            fontWeight: 'bold'
          }}
        >
          {instructor.INSTRUCTOR_NAME ? instructor.INSTRUCTOR_NAME[0] : '?'}
        </div>
      </div>
      <div className="instructor-card__info">
        <h3 className="instructor-card__name">{instructor.INSTRUCTOR_NAME}</h3>
        {instructor.INSTRUCTOR_DESC && (
          <p className="instructor-card__desc">
            {truncateDesc(instructor.INSTRUCTOR_DESC)}
          </p>
        )}
      </div>
      <div className="instructor-card__arrow">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

export default InstructorCard
