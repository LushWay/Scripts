import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { generateDefine } from './tools/define'

export default defineConfig({
  define: generateDefine({ dev: true, test: true, world: false, port: '1000', vitest: true }),
  test: {
    globals: true,

    isolate: false,
    pool: 'threads',

    coverage: {
      provider: 'istanbul',
      reporter: process.env.CI ? ['lcov'] : ['html', 'json'],
      include: ['src/lib', 'src/modules'],
      exclude: ['src/lib/assets', 'src/lib/bds', 'src/test', '**/*.test.ts', '**/*.spec.ts'],
    },
    setupFiles: ['src/test/setup.ts'],
    globalSetup: ['src/test/global.ts'],
    alias: {
      '@minecraft/server': 'test/__mocks__/minecraft_server.ts',
      '@minecraft/server-net': 'test/__mocks__/minecraft_server-net.ts',
      '@minecraft/server-ui': 'test/__mocks__/minecraft_server-ui.ts',
      '@minecraft/server-gametest': 'test/__mocks__/minecraft_server-gametest.ts',
    },
    exclude: ['**/*.spec.ts', 'node_modules/**', 'scripts'],
  },
  plugins: [tsconfigPaths()],
})
