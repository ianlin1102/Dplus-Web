import { useState, useEffect } from 'react';

/**
 * 检测设备类型的 Hook
 * @returns {{ isMobile: boolean, isTablet: boolean, isDesktop: boolean }}
 */
const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setDeviceType({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // 初始检测
    checkDevice();

    // 监听窗口大小变化
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
};

export default useDeviceType;
