import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176, // 改用 5176 端口（5173-5175 都被占用）
    strictPort: false, // 如果端口被占用，自动尝试下一个端口
    open: true // 启动时自动打开浏览器
  }
})
