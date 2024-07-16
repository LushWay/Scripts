import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { generateDefine } from '../define.js'
import { error } from '../error.js'
import { logger } from './logger.js'

/** @typedef {ReturnType<typeof parseCliArguments>} CliOptions */

/**
 * @param {string} dir
 * @param {string} file
 */
export function parseCliArguments(dir, file) {
  try {
    const { values } = util.parseArgs({
      args: process.argv.slice(2),
      options: {
        dev: { type: 'boolean', default: false },
        test: { type: 'boolean', default: false },
        vitest: { type: 'boolean', default: false },
        world: { type: 'boolean', default: false },
        port: { type: 'string', default: '19514' },
        help: { type: 'boolean', default: false, short: 'h' },
        outdir: { type: 'string', default: dir },
        outfile: { type: 'string', default: file },
      },
    })
    const { dev, test, world, port, vitest, outdir, outfile } = values

    if (values.help) {
      logger.info(`build [options] 

  Options:
  --dev: [bool=false] ${dev}
  --test: [bool=false] ${test}
  --vitest: [bool=false] ${vitest}
  --world: [bool=false] ${world}
  --port: [int=19514] ${port}
  --outdir: [string='${dir}'] ${outdir}
  --outfile: [string='${file}'] ${outfile}

  --help: Shows this page
`)
      process.exit(0)
    }

    if (isNaN(parseInt(port ?? ''))) throw `Port must be a number, recieved '${port}'`
    return { dev, test, world, port, vitest, ...getPathsAndCleanDirectory(dir, file) }
  } catch (e) {
    logger.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
}

/**
 * @param {string} dir
 * @param {string} file
 */
function getPathsAndCleanDirectory(dir, file) {
  try {
    if (fs.existsSync(path.join(dir, '.git'))) {
      logger.error('Unable to empty dir which contains .git folder:', path.join(process.cwd(), dir))
      process.exit(1)
    }
    fs.rmSync(dir, { force: true, recursive: true })
    fs.mkdirSync(dir)
  } catch (e) {
    if (!error(e).is('EACESS')) logger.warn('Failed to empty out dir', e)
  }

  return { outdir: dir, outfile: path.join(dir, file) }
}

/**
 * @param {CliOptions} param0
 * @param {esbuild.BuildOptions} options
 */
export function build({ test, dev, world, port, vitest, outfile }, options) {
  let start = Date.now()
  let firstBuild = true

  /** @type {esbuild.BuildOptions} */
  const config = {
    outfile,
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
