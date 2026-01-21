/**
 * 预约确认页面
 * 显示课程详情、卡项选择、预约协议等
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Music,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import CardSelector from '../../components/CardSelector';
import CancelPolicy from '../../components/CancelPolicy';
import BookingAgreement from '../../components/BookingAgreement';
import {
  getMeetDetailForJoin,
  beforeJoin,
  submitJoin,
  getAvailableCardsForBooking,
  calculateDuration,
  formatDuration
} from '../../services/bookingService';
import { getMyCards } from '../../services/cardService';
import CloudImage from '../../components/CloudImage';
import './BookingConfirm.css';

const BookingConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { user, isLoggedIn } = useAuth();

  // 从 location.state 获取传递的数据
  const passedMeet = location.state?.meet;
  const passedDay = location.state?.day;
  const passedTimeSlot = location.state?.timeSlot;

  // URL 参数（作为备用）
  const meetId = searchParams.get('meetId');
  const day = passedDay || searchParams.get('day');
  const timeMark = searchParams.get('timeMark');
  const timeStart = passedTimeSlot?.start || searchParams.get('start');
  const timeEnd = passedTimeSlot?.end || searchParams.get('end');

  // 状态
  const [loading, setLoading] = useState(true);
  const [meetDetail, setMeetDetail] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);  // 余额充足的卡项
  const [allUserCards, setAllUserCards] = useState([]);       // 用户所有卡项
  const [selectedCardId, setSelectedCardId] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login', {
        state: { returnUrl: `/booking/confirm?${searchParams.toString()}` }
      });
    }
  }, [isLoggedIn, navigate, searchParams]);

  // 加载预约详情
  useEffect(() => {
    const loadData = async () => {
      if (!meetId || !timeMark) {
        setError(language === 'zh' ? '缺少预约参数' : 'Missing booking parameters');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let meetData;

        // 优先使用传递过来的数据
        if (passedMeet) {
          console.log('使用传递的 meet 数据:', passedMeet);
          // 云函数返回的是camelCase字段名，转换为MEET_*格式供后续使用
          meetData = {
            _id: passedMeet._id,
            MEET_TITLE: passedMeet.title || passedMeet.MEET_TITLE,
            MEET_TYPE_ID: passedMeet.typeId || passedMeet.MEET_TYPE_ID,
            MEET_TYPE_NAME: passedMeet.typeName || passedMeet.MEET_TYPE_NAME,
            MEET_INSTRUCTOR_ID: passedMeet.instructorId || passedMeet.MEET_INSTRUCTOR_ID,
            MEET_INSTRUCTOR_NAME: passedMeet.instructorName || passedMeet.MEET_INSTRUCTOR_NAME,
            MEET_INSTRUCTOR_PIC: passedMeet.instructorPic || passedMeet.MEET_INSTRUCTOR_PIC,
            MEET_COURSE_INFO: passedMeet.courseInfo || passedMeet.MEET_COURSE_INFO,
            // 注意: 这些字段在list API中不返回，需要在前端有默认值
            MEET_CONTENT: passedMeet.MEET_CONTENT || [],
            MEET_FORM_SET: passedMeet.MEET_FORM_SET || [],
            MEET_COST_SET: passedMeet.MEET_COST_SET || { isEnabled: false, costType: 'free' },
            MEET_CANCEL_SET: passedMeet.MEET_CANCEL_SET || { isLimit: false },
            MEET_IS_SHOW_LIMIT: passedMeet.MEET_IS_SHOW_LIMIT ?? 1,
            // 时段信息
            day: passedDay,
            dayDesc: passedMeet.dayDesc,
            timeStart: passedTimeSlot?.start,
            timeEnd: passedTimeSlot?.end,
            limit: passedTimeSlot?.limit,
            cnt: passedTimeSlot?.cnt
          };
        } else {
          // 如果没有传递数据，尝试从 API 获取（可能会失败）
          console.log('尝试从 API 获取 meet 数据...');
          const result = await getMeetDetailForJoin(meetId, timeMark);

          if (result.code !== 200 || !result.data) {
            throw new Error(result.msg || '获取预约详情失败');
          }

          meetData = result.data;
        }

        setMeetDetail(meetData);

        // 如果需要卡项，加载可用卡项
        const costSet = meetData.MEET_COST_SET || {};
        if (costSet.isEnabled && costSet.costType !== 'free') {
          // 获取用户 ID
          const authData = localStorage.getItem('auth_user');
          let userId = null;
          if (authData) {
            const userData = JSON.parse(authData);
            userId = userData._id || userData.USER_MINI_OPENID;
          }

          // 同时获取所有卡项和可用卡项
          const [allCards, availableCardList] = await Promise.all([
            userId ? getMyCards(userId, { includeExpired: false }) : [],
            getAvailableCardsForBooking(costSet)
          ]);

          setAllUserCards(allCards || []);
          setAvailableCards(availableCardList || []);

          // 自动选择第一张可用卡
          if (availableCardList.length > 0) {
            setSelectedCardId(availableCardList[0]._id);
          }
        }
      } catch (err) {
        console.error('加载预约详情失败:', err);
        setError(err.message || (language === 'zh' ? '加载失败' : 'Failed to load'));
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn()) {
      loadData();
    }
  }, [meetId, timeMark, passedMeet, passedDay, passedTimeSlot, language, isLoggedIn]);

  // 提交预约
  const handleSubmit = async () => {
    const costSet = meetDetail?.MEET_COST_SET || {};
    const needCard = costSet.isEnabled && costSet.costType !== 'free';

    // 验证卡项
    if (needCard && !selectedCardId) {
      setError(language === 'zh' ? '请选择支付卡项' : 'Please select a payment card');
      return;
    }

    // 验证协议
    if (!agreedTerms) {
      setError(language === 'zh' ? '请阅读并同意预约须知' : 'Please agree to the booking terms');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 预约前检测（传递 day 参数以便更可靠地查询）
      const checkResult = await beforeJoin(meetId, timeMark, day);
      if (checkResult.code !== 200) {
        throw new Error(checkResult.msg || '预约检测失败');
      }

      // 提交预约
      const result = await submitJoin(meetId, timeMark, [], needCard ? selectedCardId : '');

      if (result.code !== 200) {
        throw new Error(result.msg || '预约失败');
      }

      // 成功
      setSuccess(true);

      // 延迟跳转到预约列表
      setTimeout(() => {
        navigate('/dashboard/schedule', {
          state: { success: true, joinId: result.data?.joinId }
        });
      }, 2000);

    } catch (err) {
      console.error('预约失败:', err);
      setError(err.message || (language === 'zh' ? '预约失败，请重试' : 'Booking failed, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekDays = language === 'zh'
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (language === 'zh') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
    }
    return `${weekDays[date.getDay()]}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // 加载中
  if (loading) {
    return (
      <div className="booking-confirm-page">
        <div className="loading-state">
          <Loader2 className="loading-spinner" size={40} />
          <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // 成功状态
  if (success) {
    return (
      <div className="booking-confirm-page">
        <div className="success-state">
          <CheckCircle size={60} className="success-icon" />
          <h2>{language === 'zh' ? '预约成功!' : 'Booking Confirmed!'}</h2>
          <p>{language === 'zh' ? '正在跳转到我的预约...' : 'Redirecting to my bookings...'}</p>
        </div>
      </div>
    );
  }

  // 错误状态（无数据）
  if (!meetDetail) {
    return (
      <div className="booking-confirm-page">
        <div className="error-state">
          <AlertCircle size={48} />
          <p>{error || (language === 'zh' ? '无法加载预约信息' : 'Unable to load booking info')}</p>
          <Link to="/calendar" className="back-link">
            {language === 'zh' ? '返回日历' : 'Back to Calendar'}
          </Link>
        </div>
      </div>
    );
  }

  const costSet = meetDetail.MEET_COST_SET || {};
  const cancelSet = meetDetail.MEET_CANCEL_SET || {};
  const needCard = costSet.isEnabled && costSet.costType !== 'free';
  const duration = calculateDuration(timeStart || meetDetail.timeStart, timeEnd || meetDetail.timeEnd);

  return (
    <div className="booking-confirm-page">
      {/* 头部 */}
      <header className="booking-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>{language === 'zh' ? '预约确认' : 'Confirm Booking'}</h1>
        <div className="header-spacer" />
      </header>

      <div className="booking-content">
        {/* 课程信息卡片 */}
        <section className="course-info-card">
          <div className="instructor-avatar">
            <CloudImage
              src={meetDetail.MEET_INSTRUCTOR_PIC}
              alt={meetDetail.MEET_INSTRUCTOR_NAME || ''}
              fallbackText={meetDetail.MEET_INSTRUCTOR_NAME || '?'}
            />
          </div>
          <div className="course-details">
            <h2 className="course-title">{meetDetail.MEET_TITLE}</h2>
            <div className="course-meta">
              <span className="meta-item">
                <User size={14} />
                {meetDetail.MEET_INSTRUCTOR_NAME || (language === 'zh' ? '待定' : 'TBD')}
              </span>
              <span className="meta-item type-badge" style={{
                background: getTypeColor(meetDetail.MEET_TYPE_NAME)
              }}>
                {meetDetail.MEET_TYPE_NAME}
              </span>
            </div>
            <div className="course-time">
              <div className="time-item">
                <Calendar size={14} />
                <span>{formatDate(day)}</span>
              </div>
              <div className="time-item">
                <Clock size={14} />
                <span>
                  {timeStart || meetDetail.timeStart} - {timeEnd || meetDetail.timeEnd}
                  {duration > 0 && ` (${formatDuration(duration, language)})`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 课程内容 - 表面信息 */}
        {meetDetail.MEET_COURSE_INFO && (
          <section className="course-section surface-info">
            <div className="section-header">
              <Music size={18} />
              <h3>{language === 'zh' ? '课程信息' : 'Course Info'}</h3>
            </div>
            <div className="section-content">
              <p>{meetDetail.MEET_COURSE_INFO}</p>
            </div>
          </section>
        )}

        {/* 课程须知 - 内部内容（可折叠） */}
        {meetDetail.MEET_CONTENT && meetDetail.MEET_CONTENT.length > 0 && (
          <section className="course-section course-notice">
            <div
              className="section-header clickable"
              onClick={() => setShowContent(!showContent)}
            >
              <FileText size={18} />
              <h3>{language === 'zh' ? '课程须知' : 'Course Notice'}</h3>
              <span className="toggle-icon">
                {showContent ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </div>
            {showContent && (
              <div className="section-content notice-content">
                {meetDetail.MEET_CONTENT.map((item, idx) => (
                  item.type === 'text'
                    ? <p key={idx}>{item.val}</p>
                    : <CloudImage key={idx} src={item.val} alt="" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 卡项选择 */}
        {needCard && (
          <section className="course-section card-section">
            <div className="section-header">
              <h3>{language === 'zh' ? '选择支付方式' : 'Select Payment'}</h3>
            </div>
            <CardSelector
              cards={availableCards}
              allUserCards={allUserCards}
              selectedId={selectedCardId}
              onSelect={setSelectedCardId}
              costSet={costSet}
              language={language}
            />
          </section>
        )}

        {/* 取消政策 - 传递 costSet 以显示返还说明 */}
        <section className="course-section">
          <CancelPolicy cancelSet={cancelSet} costSet={costSet} language={language} />
        </section>

        {/* 预约协议 */}
        <section className="course-section agreement-section">
          <BookingAgreement
            agreed={agreedTerms}
            onChange={setAgreedTerms}
            termsContent={meetDetail.MEET_CONTENT || []}
            language={language}
          />
        </section>

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          className={`submit-btn ${submitting ? 'loading' : ''} ${(!agreedTerms || (needCard && !selectedCardId)) ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={submitting || !agreedTerms || (needCard && !selectedCardId)}
        >
          {submitting ? (
            <>
              <Loader2 className="btn-spinner" size={20} />
              {language === 'zh' ? '预约中...' : 'Booking...'}
            </>
          ) : (
            language === 'zh' ? '确认预约' : 'Confirm Booking'
          )}
        </button>
      </div>
    </div>
  );
};

// 根据舞蹈类型获取颜色
function getTypeColor(typeName) {
  const colors = {
    'Hip-Hop': 'rgba(239, 68, 68, 0.3)',
    'K-Pop': 'rgba(59, 130, 246, 0.3)',
    'Jazz Funk': 'rgba(234, 179, 8, 0.3)',
    'Street Dance': 'rgba(34, 197, 94, 0.3)',
    'Popping': 'rgba(168, 85, 247, 0.3)',
    'Classical': 'rgba(236, 72, 153, 0.3)'
  };
  return colors[typeName] || 'rgba(107, 114, 128, 0.3)';
}

export default BookingConfirm;
