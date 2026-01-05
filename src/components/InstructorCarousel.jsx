import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './InstructorCarousel.css'

const InstructorCarousel = ({ instructors, onInstructorClick }) => {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!instructors || instructors.length === 0) {
    return null
  }

  return (
    <div className="instructor-carousel">
      {/* 左箭头 */}
      <button
        className="carousel-arrow carousel-arrow--left"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <ChevronLeft size={24} />
      </button>

      {/* 滚动容器 */}
      <div className="carousel-track" ref={scrollRef}>
        {instructors.map((instructor) => (
          <div
            key={instructor._id}
            className="carousel-item"
            onClick={() => onInstructorClick && onInstructorClick(instructor)}
          >
            <div className="carousel-item__avatar">
              {instructor.INSTRUCTOR_PIC ? (
                <img
                  src={instructor.INSTRUCTOR_PIC}
                  alt={instructor.INSTRUCTOR_NAME}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className="carousel-item__placeholder"
                style={{ display: instructor.INSTRUCTOR_PIC ? 'none' : 'flex' }}
              >
                {instructor.INSTRUCTOR_NAME ? instructor.INSTRUCTOR_NAME[0] : '?'}
              </div>
            </div>
            <div className="carousel-item__name">
              {instructor.INSTRUCTOR_NAME}
            </div>
          </div>
        ))}
      </div>

      {/* 右箭头 */}
      <button
        className="carousel-arrow carousel-arrow--right"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  )
}

export default InstructorCarousel
