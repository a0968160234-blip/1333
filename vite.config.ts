import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 這是關鍵：設定相對路徑，確保在 GitHub Pages 子目錄下能讀取資源
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})