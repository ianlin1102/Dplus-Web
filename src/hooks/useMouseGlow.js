import { useState, useCallback, useRef } from 'react';

/**
 * 鼠标跟随光效 Hook
 * @param {Object} options - 配置选项
 * @param {number} options.smoothing - 平滑度，值越大延迟越大 (默认 0.15)
 * @param {boolean} options.enabled - 是否启用 (默认 true)
 * @returns {Object} { position, isActive, handlers }
 */
const useMouseGlow = ({ smoothing = 0.15, enabled = true } = {}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const targetPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);

  // 平滑动画更新位置
  const animatePosition = useCallback(() => {
    setPosition((prev) => {
      const dx = targetPosition.current.x - prev.x;
      const dy = targetPosition.current.y - prev.y;

      // 如果距离足够小，停止动画
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        return targetPosition.current;
      }

      // 线性插值实现平滑效果
      return {
        x: prev.x + dx * smoothing,
        y: prev.y + dy * smoothing,
      };
    });

    animationFrame.current = requestAnimationFrame(animatePosition);
  }, [smoothing]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!enabled) return;

      // 获取相对于容器的位置
      const rect = e.currentTarget.getBoundingClientRect();
      targetPosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // 启动动画循环
      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(animatePosition);
      }
    },
    [enabled, animatePosition]
  );

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    setIsActive(true);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
    // 停止动画
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  }, []);

  return {
    position,
    isActive,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    // 光晕样式生成器
    getGlowStyle: (size = 200, color = 'rgba(138, 43, 226, 0.3)') => ({
      position: 'absolute',
      left: position.x - size / 2,
      top: position.y - size / 2,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      pointerEvents: 'none',
      opacity: isActive ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }),
  };
};

export default useMouseGlow;
