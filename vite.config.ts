import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3108,
    proxy: {
      '/api/astros': {
        target: 'http://api.open-notify.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/launch-library': {
        target: 'https://ll.thespacedevs.com/2.2.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/launch-library/, ''),
        secure: true
      }
    }
  }
})
