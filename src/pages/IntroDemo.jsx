import React, { useState } from 'react';
import { motion } from 'framer-motion';
import IntroOverlay from '../components/IntroOverlay';
import useDeviceType from '../hooks/useDeviceType';

/**
 * 开场动画演示页面
 *
 * 包含:
 * 1. IntroOverlay 开场动画
 * 2. 响应式主内容区域
 */

const IntroDemo = () => {
  const [showIntro, setShowIntro] = useState(true);
  const { isMobile } = useDeviceType();

  const handleEnter = () => {
    console.log('Entered!');
  };

  const handleReset = () => {
    setShowIntro(true);
  };

  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden font-sans">
      {/* 背景内容层 (Main Content) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        {/* 背景图片 */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40 grayscale-[0.3]"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2069&auto=format&fit=crop")',
          }}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]" />
        </div>

        {/* 主内容 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: showIntro ? 0 : 0.5 }}
          className="relative z-10"
        >
          <h1 className={`font-black text-white tracking-tighter italic ${
            isMobile
              ? 'text-4xl'
              : 'text-5xl md:text-8xl'
          }`}>
            FEEL THE <span className="text-[#00FFFF]">RHYTHM</span>
          </h1>

          <p className={`mt-4 text-gray-400 uppercase ${
            isMobile
              ? 'text-sm tracking-[0.2em]'
              : 'text-lg md:text-xl tracking-[0.5em]'
          }`}>
            Premium Dance Experience
          </p>

          <button
            className={`mt-8 border border-[#8A2BE2] text-white hover:bg-[#8A2BE2] transition-all duration-300 uppercase tracking-widest text-sm ${
              isMobile
                ? 'px-6 py-3'
                : 'px-10 py-4'
            }`}
            onClick={handleReset}
          >
            Replay Intro
          </button>
        </motion.div>
      </div>

      {/* 开场磨砂大门 */}
      {showIntro && (
        <IntroOverlay onEnter={handleEnter} />
      )}

      {/* 全局样式 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

export default IntroDemo;
