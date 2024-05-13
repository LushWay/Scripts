// @ts-check

import * as esbuild from 'esbuild'
import fs from 'fs'
import { LeafyLogger, PackageJSON, writeJSON } from 'leafy-utils'
import path from 'path'
import util from 'util'
const logger = new LeafyLogger({ prefix: 'build' })

let dev, test, world, port

try {
  const { values } = util.parseArgs({
    args: process.argv.slice(2),
    options: {
      dev: { type: 'boolean' },
      test: { type: 'boolean' },
      world: { type: 'boolean' },
      port: { type: 'string', default: '19514' },
    },
  })
  ;({ dev, test, world, port = '19514' } = values)

  if (isNaN(parseInt(port))) {
    throw `Port must be a number, recieved '${port}'`
  }
} catch (e) {
  logger.error(e instanceof Error ? e.message : e)
  process.exit(1)
}

const outdir = 'scripts'
const outfile = path.join(outdir, 'index.js')

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

  define: Object.fromEntries(
    Object.entries({
      __DEV__: dev,
      __PRODUCTION__: !dev,
      __RELEASE__: false,
      __TEST__: test,
      __SERVER__: !world,
      __SERVER_PORT__: Number(port),
    }).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]),
  ),

  external: [
    '@minecraft/server',
    '@minecraft/server-ui',
    '@minecraft/server-net',
    '@minecraft/server-admin',
    '@minecraft/server-gametest',
  ],
  legalComments: 'none',
  plugins: [
    {
      name: 'start/stop',
      setup(build) {
        build.onStart(() => {
          start = Date.now()
        })
        build.onEnd(message)
      },
    },
  ],
}

let start = Date.now()

if (dev) {
  esbuild.context(config).then(ctx => ctx.watch())
} else {
  esbuild.build(config)
}

let firstBuild = true
function message() {
  const mode = dev ? 'development' : test ? 'test' : 'production'
  const time = `in ${Date.now() - start}ms`
  if (firstBuild) {
    if (dev) {
      logger.success(
        `Started esbuild in dev mode! Edit src and it will autobuild and reload!${test ? ' Test build is enabled.' : ''} HTTP port: ${port}`,
      )
    } else {
      logger.info(`Built for ${mode} ${time}`)
    }

    firstBuild = false
  } else {
    logger.info(`Rebuild for ${mode} ${time}`)
    if (dev && process.send) {
      process.send('reload')
    }
  }
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
    capabilities: dev || test ? ['script_eval'] : [],
  }

  base.dependencies = dependencies
    .filter(e => {
      if (!!world) {
        // net is not available on common worlds
        if (e[0] === '@minecraft/server-net') return false
      }
      return true
    })
    .map(e => ({
      module_name: e[0],
      version: e[1],
    }))

  await writeJSON('./manifest.json', base).catch(e => logger.error('Failed writing manifest.json file:', e))
  await packagejson.write()
}
