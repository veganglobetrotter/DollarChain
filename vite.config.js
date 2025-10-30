import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.replit.dev', '.repl.co'], // ✅ allow Replit preview URLs
    host: true, // ✅ allow external hosts like the preview domain
    port: 5173, // (optional, default)
  },
})
