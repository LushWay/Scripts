// @ts-check

import { readFileSync, writeFileSync } from 'fs'
import { buildArgumentsWithDist, buildCommand } from './build/cli.js'
import { injectCode } from './build/inject.js'
import { generateManigestJson } from './build/manifest.js'

const playerJsonAsset = 'src/lib/assets/player-json.ts'
try {
  const player = readFileSync('entities/player.json').toString()
  writeFileSync(playerJsonAsset, injectCode('tools/build.js', `export const playerJson = ${player.trimEnd()} as const`))
} catch (e) {
  console.warn('Unable to update', playerJsonAsset + ':', e)
}

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
