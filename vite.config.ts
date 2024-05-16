import tsconfig from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __TEST__: 'true',
  },
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['html'],
    },
    alias: {
      '@minecraft/server': 'test/__mocks__/minecraft_server.ts',
    },
    exclude: ['**/*.spec.ts', 'node_modules/**', 'scripts'],
  },
  plugins: [tsconfig()],
})
