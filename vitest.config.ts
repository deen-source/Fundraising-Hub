import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/lib/**/*.test.ts'],
    exclude: [
      'node_modules/',
      'dist/',
      'src/components/**',
      'src/pages/**',
      'src/hooks/**',
      'src/integrations/**',
      'src/data/**',
      'src/main.tsx',
      'src/App.tsx',
      'src/App.css',
      'src/index.css',
      'src/vite-env.d.ts'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'node_modules/',
        'src/lib/**/*.test.ts',
        'dist/'
      ]
    }
  },
  css: false,
  plugins: []
})
