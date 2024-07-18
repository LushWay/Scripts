// @ts-check

import { build, buildArgumentsWithDist } from './build/cli.js'
import { generateManigestJson } from './build/manifest.js'

const args = buildArgumentsWithDist('scripts')
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
generateManigestJson(args)
