import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 部署到根路径
  server: {
    port: 5176, // 改用 5176 端口（5173-5175 都被占用）
    strictPort: false, // 如果端口被占用，自动尝试下一个端口
    open: true, // 启动时自动打开浏览器
    host: 'localhost', // 明确指定主机
    hmr: {
      overlay: false, // 禁用错误覆盖层，减少渲染压力
      protocol: 'ws', // 明确使用 WebSocket 协议
      host: 'localhost',
      port: 5176
    },
    watch: {
      usePolling: false, // 禁用轮询，使用原生文件系统事件
      ignored: ['**/node_modules/**', '**/.git/**'] // 忽略不需要监听的目录
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'], // 预构建依赖
    exclude: [] // 排除预构建
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境不生成 sourcemap
    rollupOptions: {
      output: {
        // 确保每次构建文件名都不同，避免浏览器缓存问题
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'cloudbase': ['@cloudbase/js-sdk']
        }
      }
    }
  }
})
