import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/personal-dashboard/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Use IPv4 loopback to avoid Windows resolving localhost -> ::1 (IPv6)
        // which can fail if Django is only listening on 127.0.0.1.
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})

