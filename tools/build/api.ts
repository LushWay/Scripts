import child_process from 'child_process'
import path from 'path'
import type {} from '../defines.js'

export function build() {
  return {
    /** @param cwd - Working directory. Defaults to '.' */
    cwd: (cwd = '.', entry?: string) => ({
      /** @param outdir - Directory where build output (index.js, index.js.map) will be written to. Defaults to scripts */
      outdir: (outdir = build.outdir) => ({
        args: (args = build.args()) => ({
          /**
           * Adds callback that will be called when initial build finishes
           *
           * @param onReady
           */
          onReady: (onReady: (outfile: string) => void) => ({
            /**
             * @param onReload - Will be called on reload in watch mode
             * @returns - Resolves with build process
             */
            onWatchModeUpdate: (
              onReload?: (this: void, changedFile: string) => void,
            ): Promise<import('child_process').ChildProcess> =>
              new Promise((resolve, reject) => {
                args = args.concat(`--outdir=${outdir}`, entry ? `--entry=${entry}` : '').filter(Boolean)
                const p = child_process
                  .fork('tools/build.ts', args, {
                    cwd,
                    stdio: 'inherit',
                    execArgv: ['--no-warnings', '--experimental-strip-types', '--experimental-transform-types'],
                  })
                  .on('message', message => {
                    if (message === 'ready') (onReady(build.outfile(outdir)), resolve(p))
                    if (Array.isArray(message) && message[0] === 'reload' && typeof message[1] === 'string')
                      onReload?.(message[1])
                  })
                  .on('error', reject)
              }), // onReload
          }), // onReady
        }), // args
      }), // outdir
    }), // cwd
  }
}

build.outdir = 'scripts'
build.outfile = (dir = build.outdir) => path.join(dir, 'index.js')
build.args = () =>
  [__DEV__ && '--dev', __TEST__ && '--test', `--port=${__SERVER_PORT__}`].filter(v => typeof v === 'string')
