// @ts-check

import { build, out, parseCliArguments } from './tools/build/cli.js'
import { generateManigestJson } from './tools/build/generateManigestJson.js'

const args = parseCliArguments()
const { outfile } = out('scripts', 'index.js')

build(args, {
  entryPoints: [!args.test ? 'src/index.ts' : 'src/test/loader.ts'],
  outfile: outfile,
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

generateManigestJson(args, outfile)

/** @typedef {ReturnType<typeof parseCliArguments>} CliOptions */
