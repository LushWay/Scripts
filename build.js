// @ts-check

import { build, parseCliArguments } from './tools/build/cli.js'
import { generateManigestJson } from './tools/build/manifest.js'

const args = parseCliArguments('scripts', 'index.js')

build(args, {
  entryPoints: [!args.test ? 'src/index.ts' : 'src/test/loader.ts'],
  target: 'es2020',
  platform: 'neutral',
  external: [
    '@minecraft/server',
    '@minecraft/server-ui',
    '@minecraft/server-net',
    '@minecraft/server-admin',
    '@minecraft/server-gametest',
  ],
})
  .onReady(() => process.send?.('ready'))
  .onReload(() => process.send?.('reload'))

generateManigestJson(args)
