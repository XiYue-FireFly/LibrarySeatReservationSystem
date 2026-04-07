import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 移动端页面代理到 app 的开发服务器
      '/mobile': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mobile/, ''),
      },
      '/api/upload': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8080', // Gateway
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    }
  }
})
