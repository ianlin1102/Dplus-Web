import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 部署到根路径
  server: {
    port: 5176, // 改用 5176 端口（5173-5175 都被占用）
    strictPort: false, // 如果端口被占用，自动尝试下一个端口
    open: true // 启动时自动打开浏览器
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境不生成 sourcemap
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'cloudbase': ['@cloudbase/js-sdk']
        }
      }
    }
  }
})
