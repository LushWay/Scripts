import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import util, { isDeepStrictEqual } from 'util'
import { generateDefine } from '../define.ts'
import { error } from '../error.ts'
import { build } from './api.ts'
import { logger } from './logger.ts'

export type BuildArgs = ReturnType<typeof buildArgumentsWithDist>

export function buildArgumentsWithDist(dir: string) {
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
        entry: { type: 'string' },
      },
      allowPositionals: true,
    })
    const { dev, test, world, port, vitest, outdir, entry } = values

    if (values.help) {
      logger.info(`build [options] 

  Options:
  --dev: [bool=false] ${dev}
  --test: [bool=false] ${test}
  --vitest: [bool=false] ${vitest}
  --world: [bool=false] ${world}
  --port: [int=19514] ${port}
  --outdir: [string='${dir}'] ${outdir}
  --entry: [string] ${entry}

  --help: Shows this page
`)
      process.exit(0)
    }

    if (isNaN(parseInt(port ?? ''))) throw `Port must be a number, recieved '${port}'`
    return { dev, test, world, port, vitest, entry, ...getOutPathsAndCleanDirectory(outdir ?? dir) }
  } catch (e) {
    logger.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
}

function getOutPathsAndCleanDirectory(dir: string) {
  try {
    if (fs.existsSync(path.join(dir, '.git'))) {
      logger.error('Unable to empty dir which contains .git folder:', path.join(process.cwd(), dir))
      process.exit(1)
    }
    fs.rmSync(dir, { force: true, recursive: true })
    fs.mkdirSync(dir)
  } catch (e) {
    if (!error(e).is('EACESS') && !error(e).is('ENOENT')) logger.warn('Failed to empty out dir', e)
  }

  return { outdir: dir, outfile: build.outfile(dir) }
}

export function buildCommand(
  { test, dev, world, port, vitest, outfile, entry }: BuildArgs,
  options: esbuild.BuildOptions,
) {
  let start = Date.now()
  let firstBuild = true
  const at = process.cwd()
  let oldmeta: import('esbuild').Metafile | undefined

  const config: esbuild.BuildOptions = {
    outfile,
    treeShaking: true,
    bundle: true,
    sourcemap: 'linked',
    legalComments: 'none',
    define: generateDefine({ dev, test, world, port, vitest }),
    metafile: true,
    ...options,
    plugins: [
      ...(options.plugins ?? []),
      {
        name: 'start/stop',
        setup(build) {
          build.onStart(() => void (start = Date.now()))
          build.onEnd(result => {
            const mode = dev ? 'development' : test ? 'test' : 'production'
            const time = `in ${Date.now() - start}ms`

            if (result.errors.length) return logger.error('Unable to build for', mode, time)

            let changed = ''
            if (oldmeta) {
              if (result.metafile)
                for (const file in result.metafile.inputs) {
                  if (file in oldmeta.inputs) {
                    if (!isDeepStrictEqual(result.metafile.inputs[file], oldmeta.inputs[file])) changed = file
                  } else {
                    changed = file
                    break
                  }
                }
              oldmeta = result.metafile
            } else oldmeta = result.metafile

            if (firstBuild) {
              if (dev) logger.success(`Watching for changes at ${at}${test ? ' Test build is enabled.' : ''}`)
              else logger.success(`Built for ${mode} at ${at} ${time}`)
              process.send?.('ready')
            } else if (dev) process.send?.(['reload', changed])

            firstBuild = false
          })
        },
      },
    ],
    entryPoints: entry ? [entry] : options.entryPoints,
  }

  if (dev) {
    esbuild.context(config).then(ctx => ctx.watch())
  } else {
    esbuild.build(config)
  }
}

export type VoidFunction = () => void
