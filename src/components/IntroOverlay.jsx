import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useDeviceType from '../hooks/useDeviceType';
import useSwipeGesture from '../hooks/useSwipeGesture';
import useMouseGlow from '../hooks/useMouseGlow';

/**
 * 开场动画组件
 *
 * 设计说明:
 * 1. 使用 Framer Motion 处理开场动画
 * 2. 采用 Glassmorphism (玻璃拟态) 风格
 * 3. 颜色方案: Violet (#8A2BE2) 和 Cyan (#00FFFF)
 * 4. 响应式设计: 手机端简化动画 + 滑动手势，网页端完整效果 + 鼠标跟随光效
 */

// 动画配置 - 手机端简化版
const mobileAnimation = {
  textShadow: [
    "0 0 10px #8A2BE2, 0 0 20px #8A2BE2",
    "0 0 5px #8A2BE2, 0 0 10px #8A2BE2",
  ],
  opacity: [1, 0.9, 1],
};

// 动画配置 - 网页端完整版
const desktopAnimation = {
  textShadow: [
    "0 0 10px #8A2BE2, 0 0 20px #8A2BE2, 0 0 40px #8A2BE2",
    "0 0 5px #8A2BE2, 0 0 10px #8A2BE2, 0 0 20px #8A2BE2",
    "0 0 10px #8A2BE2, 0 0 25px #8A2BE2, 0 0 50px #8A2BE2",
  ],
  opacity: [1, 0.8, 1, 0.9, 1, 0.5, 1],
};

// 上滑箭头动画组件
const SwipeUpArrow = () => (
  <motion.div
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    className="flex flex-col items-center"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-white/50"
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  </motion.div>
);

const IntroOverlay = ({ onEnter }) => {
  const [isEntered, setIsEntered] = useState(false);
  const { isMobile, isDesktop } = useDeviceType();

  // 锁定页面滚动，直到用户进入
  useEffect(() => {
    if (!isEntered) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isEntered]);

  // 进入回调
  const handleEnter = () => {
    setIsEntered(true);
    onEnter?.();
  };

  // 手机端滑动手势
  const { isSwiping, ref, ...swipeHandlers } = useSwipeGesture({
    threshold: 50,
    onSwipeUp: handleEnter,
  });

  // 网页端鼠标跟随光效
  const { position, isActive, handlers: mouseHandlers, getGlowStyle } = useMouseGlow({
    enabled: isDesktop,
    smoothing: 0.12,
  });

  // 选择动画配置
  const neonAnimation = isMobile ? mobileAnimation : desktopAnimation;
  const animationDuration = isMobile ? 3 : 2;
  const animationTimes = isMobile ? [0, 0.5, 1] : [0, 0.1, 0.2, 0.3, 0.5, 0.6, 1];

  return (
    <AnimatePresence>
      {!isEntered && (
        <motion.div
          key="intro-door"
          initial={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 1.1,
            filter: "blur(0px)",
            transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
          onClick={handleEnter}
          className="fixed inset-0 z-50 cursor-pointer flex items-center justify-center group"
          // 手机端绑定滑动手势
          {...(isMobile ? swipeHandlers : {})}
          // 网页端绑定鼠标事件
          {...(isDesktop ? mouseHandlers : {})}
        >
          {/* 玻璃材质主体 - 手机端减少模糊强度 */}
          <div
            className={`absolute inset-0 bg-black/40 ${
              isMobile ? 'backdrop-blur-[10px]' : 'backdrop-blur-[25px]'
            }`}
          />

          {/* 霓虹边框环绕 - 手机端更紧凑 */}
          <div className={`absolute ${isMobile ? 'inset-2' : 'inset-4'} border-[1px] border-white/10 rounded-xl overflow-hidden`}>
            {/* 动态边框光效 */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-tr from-[#8A2BE2] via-transparent to-[#00FFFF]" />
          </div>

          {/* 网页端鼠标跟随光晕 */}
          {isDesktop && isActive && (
            <div style={getGlowStyle(300, 'rgba(138, 43, 226, 0.25)')} />
          )}

          {/* Logo 容器 */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{
                ...neonAnimation,
              }}
              transition={{
                duration: animationDuration,
                repeat: Infinity,
                repeatType: "mirror",
                times: animationTimes,
              }}
              className={`font-black italic tracking-tighter ${
                isMobile
                  ? 'text-[15vw]'
                  : 'text-[12vw] md:text-[8vw] lg:text-[6vw]'
              }`}
            >
              <span className="text-white">D</span>
              <span className="text-[#00FFFF]">plus</span>
            </motion.div>

            {/* 提示文字 - 手机端显示滑动提示 */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-4 flex flex-col items-center"
            >
              {isMobile && <SwipeUpArrow />}
              <p className={`text-white/50 uppercase text-[10px] md:text-xs ${
                isMobile ? 'tracking-[0.3em] mt-2' : 'tracking-[0.8em]'
              }`}>
                {isMobile ? 'Swipe up or tap' : 'Click to enter'}
              </p>
            </motion.div>
          </div>

          {/* 装饰性光晕 - 手机端减小范围 */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none ${
              isMobile
                ? 'w-[40vw] h-[40vw] bg-[#8A2BE2]/8 blur-[80px]'
                : 'w-[60vw] h-[60vw] bg-[#8A2BE2]/10 blur-[120px]'
            }`}
          />

          {/* 手机端安全区适配 */}
          {isMobile && (
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 'env(safe-area-inset-bottom, 20px)' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroOverlay;
