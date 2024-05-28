import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { generateDefine } from './generateDefine.js'
import { logger } from './logger.js'

export function parseCliArguments() {
  let dev, test, world, port, vitest

  try {
    const { values } = util.parseArgs({
      args: process.argv.slice(2),
      options: {
        dev: { type: 'boolean', default: false },
        test: { type: 'boolean', default: false },
        vitest: { type: 'boolean', default: false },
        world: { type: 'boolean', default: false },
        port: { type: 'string' },
        help: { type: 'boolean', default: false, short: 'h' },
      },
    })
    ;({ dev, test, world, port, vitest } = values)

    if (values.help) {
      logger.info(`build [options] 
  --dev: bool
  --test: bool
  --vitest: bool
  --world: bool
  --port: int
`)
      process.exit(0)
    }

    if (!port) port = '19514'
    if (isNaN(parseInt(port))) {
      throw `Port must be a number, recieved '${port}'`
    }
  } catch (e) {
    logger.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }

  return { dev, test, world, port, vitest }
}

/**
 * @param {string} dir
 * @param {string} file
 */
export function out(dir, file) {
  try {
    fs.rmSync(dir, { force: true, recursive: true })
    fs.mkdirSync(dir)
  } catch (e) {
    logger.warn(e)
  }

  return { outdir: dir, outfile: path.join(dir, file) }
}

/**
 * @param {import('../../build.js').CliOptions} param0
 * @param {esbuild.BuildOptions} options
 */
export function build({ test, dev, world, port, vitest }, options) {
  let start = Date.now()
  let firstBuild = true

  /** @type {esbuild.BuildOptions} */
  const config = {
    treeShaking: true,
    bundle: true,
    sourcemap: 'linked',
    legalComments: 'none',
    define: generateDefine({ dev, test, world, port, vitest }),

    plugins: [
      {
        name: 'start/stop',
        setup(build) {
          build.onStart(() => {
            start = Date.now()
          })
          build.onEnd(() => {
            const mode = dev ? 'development' : test ? 'test' : 'production'
            const time = `in ${Date.now() - start}ms`

            if (firstBuild) {
              if (dev) logger.success(`Started esbuild in watch mode${test ? ' Test build is enabled.' : ''}`)
              else logger.info(`${firstBuild ? 'Built' : 'Rebuilt'} for ${mode} ${time}`)
              onready?.()
            } else if (dev) onreload?.()

            firstBuild = false
          })
        },
      },
    ],
    ...options,
  }

  if (dev) {
    esbuild.context(config).then(ctx => ctx.watch())
  } else {
    esbuild.build(config)
  }

  /** @type {VoidFunction | null} */
  let onready
  /** @type {VoidFunction | null} */
  let onreload

  return {
    /** @param {VoidFunction} callback */
    onReady(callback) {
      onready = callback
      return this
    },
    /** @param {VoidFunction} callback */
    onReload(callback) {
      onreload = callback
      return this
    },
  }
}

/** @typedef {() => void} VoidFunction */
