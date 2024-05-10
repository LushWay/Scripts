import path from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __TEST__: 'true',
  },
  test: {
    alias: {
      '@minecraft/server': 'test/__mocks__/minecraft_server.ts',
    },
    exclude: ['**/*.test.ts'],
  },
  plugins: [path()],
})
