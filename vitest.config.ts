import { defineProjectConfig } from '../vitest.base.config'

export default defineProjectConfig({
  test: {
    globals: true,
    isolate: false,
    pool: 'threads',
    setupFiles: ['src/test/setup.ts'],
    globalSetup: ['src/test/global.ts'],
    alias: {
      '@minecraft/server': 'src/test/__mocks__/minecraft_server.ts',
      '@minecraft/server-net': 'src/test/__mocks__/minecraft_server-net.ts',
      '@minecraft/server-ui': 'src/test/__mocks__/minecraft_server-ui.ts',
      '@minecraft/server-gametest': 'src/test/__mocks__/minecraft_server-gametest.ts',
    },
    coverage: {
      include: ['src/lib', 'src/modules'],
      exclude: ['src/lib/assets', 'src/lib/bds', 'src/test'],
    },
    exclude: ['**/*.spec.ts', 'node_modules/**', 'scripts'],
  },
})
