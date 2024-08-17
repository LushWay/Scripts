import tsconfig_paths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { generateDefine } from './tools/define'

export default defineConfig({
  define: generateDefine({ dev: true, test: true, world: false, port: '1000', vitest: true }),
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'json', 'lcov'],
      include: ['src/lib', 'src/modules'],
      exclude: ['src/lib/assets', 'src/lib/bds', 'src/test', '**/*.test.ts', '**/*.spec.ts'],
    },
    alias: {
      '@minecraft/server': 'test/__mocks__/minecraft_server.ts',
      '@minecraft/server-net': 'test/__mocks__/minecraft_server-net.ts',
      '@minecraft/server-ui': 'test/__mocks__/minecraft_server-ui.ts',
      '@minecraft/server-gametest': 'test/__mocks__/minecraft_server-gametest.ts',
    },
    exclude: ['**/*.spec.ts', 'node_modules/**', 'scripts'],
  },
  plugins: [tsconfig_paths()],
})
