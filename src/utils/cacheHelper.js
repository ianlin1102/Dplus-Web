const CACHE_PREFIX = 'smartbeauty_web_'
const DEFAULT_CACHE_TIME = 30 * 60 * 1000 // 30 minutes

export const cacheHelper = {
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 生存时间（毫秒），默认30分钟
   */
  set: (key, value, ttl = DEFAULT_CACHE_TIME) => {
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    }
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
    } catch (error) {
      console.error('缓存设置失败:', error)
    }
  },

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {*} 缓存值，如果不存在或已过期则返回 null
   */
  get: (key) => {
    try {
      const itemStr = localStorage.getItem(CACHE_PREFIX + key)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      const now = Date.now()

      // 检查过期
      if (now - item.timestamp > item.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }

      return item.value
    } catch (error) {
      console.error('缓存获取失败:', error)
      return null
    }
  },

  /**
   * 移除指定缓存
   * @param {string} key - 缓存键
   */
  remove: (key) => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key)
    } catch (error) {
      console.error('缓存移除失败:', error)
    }
  },

  /**
   * 清除所有应用缓存
   */
  clear: () => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('缓存清除失败:', error)
    }
  }
}
