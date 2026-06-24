import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // ✅ critical para ma-access sa host machine
    port: 5173,
    watch: {
      usePolling: true  // ✅ important sa Docker para ma-detect ang changes
    }
  }
})