import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 滑动手势检测 Hook
 * @param {Object} options - 配置选项
 * @param {number} options.threshold - 触发滑动的最小距离 (默认 50px)
 * @param {Function} options.onSwipeUp - 向上滑动回调
 * @param {Function} options.onSwipeDown - 向下滑动回调
 * @param {Function} options.onSwipeLeft - 向左滑动回调
 * @param {Function} options.onSwipeRight - 向右滑动回调
 * @param {boolean} options.lockScroll - 是否锁定页面滚动 (默认 false)
 * @returns {Object} 触摸事件处理器
 */
const useSwipeGesture = ({
  threshold = 50,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  lockScroll = false,
} = {}) => {
  const touchStart = useRef({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const elementRef = useRef(null);

  // 锁定/解锁页面滚动
  useEffect(() => {
    if (lockScroll) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [lockScroll]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(true);
  }, []);

  // 不再需要 touchMove 的 preventDefault（会引起 passive listener 警告）
  const handleTouchMove = useCallback(() => {
    // 空函数，滚动锁定通过 CSS overflow: hidden 实现
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!isSwiping) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 判断主要滑动方向
    if (absY > absX && absY > threshold) {
      // 垂直滑动
      if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      } else if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      }
    } else if (absX > absY && absX > threshold) {
      // 水平滑动
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    setIsSwiping(false);
  }, [isSwiping, threshold, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]);

  const handleTouchCancel = useCallback(() => {
    setIsSwiping(false);
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    isSwiping,
    ref: elementRef,
  };
};

export default useSwipeGesture;
