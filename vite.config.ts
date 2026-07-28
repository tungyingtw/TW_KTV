import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/TW_KTV/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true, // 允許所有外網 Tunnel 域名直連存取
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
