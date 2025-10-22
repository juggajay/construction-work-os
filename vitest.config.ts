import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./lib/test-utils/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'lib/test-utils/',
        'e2e/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types/',
        '**/*.spec.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
