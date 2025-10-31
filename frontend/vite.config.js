import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections in Docker
    port: 5173,
    proxy: {
      '/api': {
        // In Docker, use service name; locally use localhost
        target: process.env.VITE_API_TARGET || 'http://backend:5000',
        changeOrigin: true,
      },
    },
  },
}))
