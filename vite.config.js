import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.replit.dev', '.repl.co'], // ✅ allow Replit preview URLs
    host: '0.0.0.0', // ✅ bind to all interfaces
    port: 5000, // ✅ required for Replit webview
  },
})
