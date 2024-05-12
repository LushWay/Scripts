// @ts-check

import * as esbuild from 'esbuild'
import fs from 'fs'
import { LeafyLogger, PackageJSON, writeJSON } from 'leafy-utils'
import path from 'path'

const development = !!process.argv.find(e => e === 'dev')
const test = !!process.argv.find(e => e === 'test')
const port = process.argv[3] ?? '19514'
const outdir = 'scripts'
const outfile = path.join(outdir, 'index.js')
const logger = new LeafyLogger({ prefix: 'build' })

try {
  fs.rmSync(outdir, { force: true, recursive: true })
  fs.mkdirSync(outdir)
} catch (e) {
  logger.warn(e)
}

/** @type {esbuild.BuildOptions} */
const config = {
  treeShaking: true,
  entryPoints: [!test ? 'src/index.ts' : 'src/test/loader.ts'],
  bundle: true,
  outfile: outfile,
  platform: 'neutral',
  target: 'es2020',
  sourcemap: 'linked',

  define: {
    __DEV__: `${development}`,
    __PRODUCTION__: `${!development}`,
    __RELEASE__: 'false',
    __TEST__: `${test}`,
    __SERVER__: `${true}`,
    __SERVER_PORT__: port,
  },

  external: [
    '@minecraft/server',
    '@minecraft/server-ui',
    '@minecraft/server-net',
    '@minecraft/server-admin',
    '@minecraft/server-gametest',
  ],
  legalComments: 'none',
}

let start = Date.now()

if (development) {
  esbuild
    .context(config)
    .then(ctx => ctx.watch())
    .then(message)
} else {
  esbuild.build(config).then(message)
}

function message() {
  logger.info(
    `${development ? 'Started watching for development' : test ? 'Build for test' : 'Built for production'} in ${Date.now() - start}ms`,
  )
  start = Date.now()
}

writeManifestJson()

async function writeManifestJson() {
  const packagejson = new PackageJSON()
  await packagejson.init()
  const dependencies = Object.entries(packagejson.content.dependencies)
    .map(([name, version]) => {
      const match = version.match(/\d+\.\d+\.\d+-(?:beta|stable)/)

      if (!match && name !== '@minecraft/vanilla-data') {
        logger.warn(
          "Version of the package '" +
            name +
            "' does not matches 0.0.0-(beta|stable) pattern, skipping insterting into manifest.json...",
        )
      }

      return [name, match?.[0] ?? '']
    })
    .filter(e => !!e[1])

  packagejson.content.resolutions = packagejson.content.dependencies

  const base = {
    format_version: 2,
    header: {
      name: 'LushWayScripts',
      description: 'Server Plugin',
      uuid: '8198b306-bfbb-48c9-874d-217cd4cef1ae',
      version: [3, 0, 4],
      min_engine_version: [1, 20, 50],
    },
    modules: [
      {
        description: 'Behavior Packs Module',
        type: 'data',
        uuid: '786cb1e6-e840-40d7-a986-9fb9e348634a',
        version: [0, 0, 0],
      },
      {
        description: 'ScriptAPI Module',
        language: 'javascript',
        type: 'script',
        uuid: '4f6a99e0-c4a2-4172-8818-c753d5cdab1f',
        version: [0, 0, 0],
        entry: outfile.replace(path.sep, '/'),
      },
    ],
    dependencies: [
      {
        module_name: '@minecraft/server',
        version: '1.8.0-beta',
      },
      {
        module_name: '@minecraft/server-ui',
        version: '1.2.0-beta',
      },
      {
        module_name: '@minecraft/server-gametest',
        version: '1.0.0-beta',
      },
      {
        module_name: '@minecraft/server-net',
        version: '1.0.0-beta',
      },
    ],
    capabilities: development || test ? ['script_eval'] : [],
  }

  base.dependencies = dependencies.map(e => ({
    module_name: e[0],
    version: e[1],
  }))

  await writeJSON('./manifest.json', base).catch(e => logger.error('Failed writing manifest.json file:', e))
  await packagejson.write()
}
