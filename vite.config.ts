import tsconfig from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { generateDefine } from './tools/build/generateDefine'

export default defineConfig({
  define: generateDefine({ dev: true, test: true, world: false, port: '0000' }),
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
