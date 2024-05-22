import tsconfig from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { generateDefine } from './tools/build/generateDefine'

export default defineConfig({
  define: generateDefine({ dev: true, test: true, world: false, port: '1000' }),
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['html'],
    },
    alias: {
      '@minecraft/server': 'test/__mocks__/minecraft_server.ts',
      '@minecraft/server-net': 'test/__mocks__/minecraft_server-net.ts',
      '@minecraft/server-ui': 'test/__mocks__/minecraft_server-ui.ts',
    },
    exclude: ['**/*.spec.ts', 'node_modules/**', 'scripts'],
  },
  plugins: [tsconfig()],
})
