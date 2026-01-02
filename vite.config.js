import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace 'repo-name' with your actual repository name
  // If your repo is https://github.com/shakeeb-sa/link-building-tool
  // Then this should be: base: "/link-building-tool/",
  base: "/link-building-execution-generator/", 
})