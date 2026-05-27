import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 1. Dùng đường dẫn tương đối để assets tìm thấy nhau
  base: './', 
  
  server: {
    // Cấu hình Proxy để tránh lỗi CORS khi dev
    proxy: {
      '/index.php': {
        target: 'https://demo.saigongreentech.com/baotramdev', // Đường dẫn đến thư mục SuiteCRM của bạn
        changeOrigin: true,
        secure: false,
      }
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Giữ tên file cố định để dễ tích hợp vào SuiteCRM PHP
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})