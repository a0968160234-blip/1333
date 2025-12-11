import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入環境變數 (包含 .env 檔案與 VITE_ 開頭的系統變數)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      // 關鍵：將建置時的環境變數 VITE_API_KEY 填入程式碼中的 process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  }
})