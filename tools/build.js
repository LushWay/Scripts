// @ts-check

import { readdirSync, readFileSync } from 'fs'
import { buildArgumentsWithDist, buildCommand } from './build/cli.js'
import { injectAsset } from './build/inject.js'
import { generateManigestJson } from './build/manifest.js'

await injectAsset(
  'generated.ts',
  'tools/build.js',
  () => `export const playerJson = ${readFileSync('entities/player.json').toString().trimEnd()} as const
  
export const totalItemsJson = ${readdirSync('items').length}`,
)

const args = buildArgumentsWithDist('scripts')
buildCommand(args, {
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
