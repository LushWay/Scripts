// @ts-check

import fs from 'fs/promises'
import { buildArgumentsWithDist, buildCommand } from './build/cli.js'
import { injectAsset, injectEnum } from './build/inject.js'
import { generateManigestJson } from './build/manifest.js'

await injectAsset(
  'player-json.ts',
  'tools/build.js',
  `export const playerJson = ${(await fs.readFile('entities/player.json')).toString().trimEnd()} as const
  
export const PlayerProperties = Object.fromEntries(
  Object.keys(playerJson['minecraft:entity'].description.properties).map(e => [e, e]),
)

export const PlayerEvents = Object.fromEntries(Object.keys(playerJson['minecraft:entity'].events).map(e => [e, e]))
`,
)

/** @type {[string, string][]} */
const entities = (
  await Promise.all(
    (await fs.readdir('entities'))
      .filter(
        e => !e.startsWith('boss.') && !['chicken', 'player', 'fireworks_rocket'].includes(e.replace('.json', '')),
      )
      .map(e => fs.readFile(`entities/${e}`, 'utf-8')),
  )
)
  .map(e => e.match(/"identifier":\s*"([^\"]+)"/)?.[1] ?? '')
  .filter(e => e !== 'f:t' && e)
  .map(e => [e.replace('lw:', '').replace('rubedo:', ''), e])

await injectAsset(
  'custom-entity-types.ts',
  'tools/build.js',
  injectEnum('CustomEntityTypes', [...entities, ['FloatingText', 'f:t']]),
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
