/**
 * 预约预览弹窗
 * 在 Calendar 点击课程后显示，展示课程信息和已预约名单
 */

import { useState, useEffect } from 'react';
import { X, User, Clock, Calendar, Users, Loader2 } from 'lucide-react';
import { getSlotBookings } from '../services/bookingService';
import CloudImage from './CloudImage';
import './BookingPreviewModal.css';

const BookingPreviewModal = ({ meet, day, timeSlot, language, onClose, onConfirm }) => {
  const [bookedNames, setBookedNames] = useState([]);
  const [loadingNames, setLoadingNames] = useState(true);

  // 加载已预约名单
  useEffect(() => {
    const loadBookings = async () => {
      if (!meet?._id || !timeSlot?.mark) {
        setLoadingNames(false);
        return;
      }

      try {
        setLoadingNames(true);
        const result = await getSlotBookings(meet._id, timeSlot.mark);
        if (result.code === 200 && result.data) {
          const list = result.data.names || result.data.list || [];
          setBookedNames(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('加载已预约名单失败:', err);
      } finally {
        setLoadingNames(false);
      }
    };

    loadBookings();
  }, [meet?._id, timeSlot?.mark]);

  if (!meet || !timeSlot) return null;

  const isFull = timeSlot.cnt >= timeSlot.limit;

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, dayNum] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, dayNum);
    const weekDays = language === 'zh'
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (language === 'zh') {
      return `${month}月${dayNum}日 ${weekDays[date.getDay()]}`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${weekDays[date.getDay()]}, ${months[month - 1]} ${dayNum}`;
  };

  return (
    <div className="booking-preview-overlay" onClick={onClose}>
      <div className="booking-preview-modal" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button className="preview-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* 课程信息 */}
        <div className="preview-course-info">
          <div className="preview-avatar">
            <CloudImage
              src={meet.instructorPic}
              alt={meet.instructorName || ''}
              fallbackText={meet.instructorName || '?'}
            />
          </div>
          <div className="preview-details">
            <h3 className="preview-title">{meet.title}</h3>
            <div className="preview-meta">
              <span className="preview-meta-item">
                <User size={14} />
                {meet.instructorName || (language === 'zh' ? '待定' : 'TBD')}
              </span>
            </div>
            <div className="preview-meta">
              <span className="preview-meta-item">
                <Calendar size={14} />
                {formatDate(day)}
              </span>
            </div>
            <div className="preview-meta">
              <span className="preview-meta-item">
                <Clock size={14} />
                {timeSlot.start} - {timeSlot.end}
              </span>
            </div>
            <div className="preview-meta">
              <span className="preview-meta-item">
                <Users size={14} />
                <span className={isFull ? 'spots-full' : ''}>
                  {language === 'zh'
                    ? `已约 ${timeSlot.cnt || 0}/${timeSlot.limit} 人`
                    : `${timeSlot.cnt || 0}/${timeSlot.limit} booked`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 已预约名单 */}
        <div className="preview-booked-section">
          <h4 className="preview-section-title">
            {language === 'zh' ? '已预约学员' : 'Booked Students'}
          </h4>
          <div className="preview-booked-list">
            {loadingNames ? (
              <div className="preview-loading">
                <Loader2 className="preview-spinner" size={20} />
                <span>{language === 'zh' ? '加载中...' : 'Loading...'}</span>
              </div>
            ) : bookedNames.length > 0 ? (
              <ol className="booked-name-list">
                {bookedNames.map((item, idx) => (
                  <li key={idx} className="booked-name-item">
                    {typeof item === 'string' ? item : (item.name || item.JOIN_USER_NAME || `${language === 'zh' ? '学员' : 'Student'} ${idx + 1}`)}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="preview-empty">
                {language === 'zh' ? '暂无预约' : 'No bookings yet'}
              </p>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="preview-actions">
          <button className="preview-btn secondary" onClick={onClose}>
            {language === 'zh' ? '关闭' : 'Close'}
          </button>
          <button
            className={`preview-btn primary ${isFull ? 'disabled' : ''}`}
            onClick={onConfirm}
            disabled={isFull}
          >
            {isFull
              ? (language === 'zh' ? '已满' : 'Full')
              : (language === 'zh' ? '去预约' : 'Book Now')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPreviewModal;
