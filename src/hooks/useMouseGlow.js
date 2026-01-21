import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 鼠标跟随光效 Hook (Performance Optimized)
 * Uses direct DOM manipulation to avoid React re-renders on every frame.
 * 
 * @param {Object} options
 * @returns {Object} { glowRef, isActive, handlers }
 */
const useMouseGlow = ({ smoothing = 0.15, enabled = true } = {}) => {
  const [isActive, setIsActive] = useState(false);
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);
  const glowRef = useRef(null);

  // 动画循环
  const animate = useCallback(() => {
    if (!glowRef.current) return;

    const dx = targetPosition.current.x - currentPosition.current.x;
    const dy = targetPosition.current.y - currentPosition.current.y;

    // 移动
    currentPosition.current.x += dx * smoothing;
    currentPosition.current.y += dy * smoothing;

    // 直接操作 DOM
    // 使用 translate3d 开启 GPU 加速
    // Center the glow: assume size is handled in CSS or passed style, 
    // but here we just move the element's top-left or center.
    // Ideally, the element is positioned at 0,0 and we move it.
    glowRef.current.style.transform = `translate3d(${currentPosition.current.x}px, ${currentPosition.current.y}px, 0)`;

    // 停止条件 (low threshold)
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      animationFrame.current = requestAnimationFrame(animate);
    } else {
      animationFrame.current = null;
    }
  }, [smoothing]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!enabled) return;

      const rect = e.currentTarget.getBoundingClientRect();
      targetPosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    },
    [enabled, animate]
  );

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    setIsActive(true);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return {
    glowRef, // New ref to attach
    isActive,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    // Helper to generate base static styles (moved dynamic parts to GPU)
    getGlowStyle: (size = 200, color = 'rgba(138, 43, 226, 0.3)') => ({
      position: 'absolute',
      left: 0, 
      top: 0,
      width: size,
      height: size,
      // Center the pivot point so translate moves the center
      marginLeft: -size / 2,
      marginTop: -size / 2,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      pointerEvents: 'none',
      opacity: isActive ? 1 : 0,
      transition: 'opacity 0.3s ease',
      willChange: 'transform', // Performance hint
    }),
  };
};

export default useMouseGlow;
