import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // R-09/R-23 — ngày local là wall-clock; pin TZ để test không đổi kết quả theo máy/CI runner.
    env: { TZ: 'Asia/Ho_Chi_Minh' },
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'entrypoints/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['node_modules/**', 'tools/**', '.wxt/**', 'dist/**', 'build/**'],
  },
});
