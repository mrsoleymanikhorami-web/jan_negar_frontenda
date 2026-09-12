import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './', // 👈 مسیردهی نسبی برای گیت‌هاب پیجز
})