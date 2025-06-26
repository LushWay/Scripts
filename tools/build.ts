import fs from 'fs/promises'
import { buildArgumentsWithDist, buildCommand } from './build/esbuild.ts'
import { injectAsset, injectEnum } from './build/inject.ts'
import { generateManifestJson } from './build/manifest.ts'

await injectAsset(
  'player-json.ts',
  'tools/build.ts',
  `export const playerJson = ${(await fs.readFile('entities/player.json')).toString().trimEnd()} as const
  
export const PlayerProperties = Object.fromEntries(
  Object.keys(playerJson['minecraft:entity'].description.properties).map(e => [e, e]),
)

export const PlayerEvents = Object.fromEntries(Object.keys(playerJson['minecraft:entity'].events).map(e => [e, e]))
`,
)

const entities: [string, string][] = (
  await Promise.all(
    (await fs.readdir('entities'))
      .filter(
        e => !e.startsWith('boss.') && !['chicken', 'player', 'fireworks_rocket'].includes(e.replace('.json', '')),
      )
      .map(e => fs.readFile(`entities/${e}`, 'utf-8')),
  )
)
  // its json with comments so to not mess with libs we have to use regex
  // its bad. sorry.
  .map(e => e.match(/"identifier":\s*"([^\"]+)"/)?.[1] ?? '')
  .filter(e => !e.startsWith('f:') && !e.startsWith('minecraft:'))
  .map(e => [e.replace('lw:', '').replace('rubedo:', ''), e])

await injectAsset(
  'custom-entity-types.ts',
  'tools/build.ts',
  injectEnum('CustomEntityTypes', [...entities, ['FloatingText', 'f:t'], ['FloatingTextNpc', 'f:t_npc']]),
)

const args = buildArgumentsWithDist('scripts')
await generateManifestJson(args)
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
