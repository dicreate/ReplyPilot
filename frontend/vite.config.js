import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Разрешаем хосты туннелей (cloudflared/devtunnels выдают новый URL при каждом
    // перезапуске — без этого Vite отвечает 403 "Blocked request... not allowed").
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})