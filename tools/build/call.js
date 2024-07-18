import child_process from 'child_process'
import path from 'path'

/** @typedef {import('../defines.js')} A */

export function forkBuild() {
  return {
    /**
     * @param {string} cwd - Working directory. Defaults to '.'
     * @param {string | undefined} [entry] - A
     */
    cwd: (cwd = '.', entry) => ({
      /**
       * @param {string} outdir - Directory where build output (index.js, index.js.map) will be written to. Defaults to
       *   scripts
       */
      outdir: (outdir = forkBuild.outdir) => ({
        args: (args = forkBuild.args()) => ({
          /**
           * Adds callback that will be called when initial build finishes
           *
           * @param {(outfile: string) => void} onReady
           */
          onReady: onReady => ({
            /**
             * @param {undefined | ((this: void) => void)} onReload - Will be called on reload in watch mode
             * @returns {Promise<import('child_process').ChildProcess>} - Resolves with build process
             */
            onWatchModeUpdate: onReload =>
              new Promise((resolve, reject) => {
                args = args.concat(`--outdir=${outdir}`, `--entry=${entry}`)
                const p = child_process
                  .fork('tools/build.js', args, { cwd, stdio: 'inherit' })
                  .on('message', message => {
                    if (message === 'ready') onReady(forkBuild.outfile(outdir)), resolve(p)
                    if (message === 'reload') onReload?.()
                  })
                  .on('error', reject)
              }), // onReload
          }), // onReady
        }), // args
      }), // outdir
    }), // cwd
  }
}

forkBuild.outdir = 'scripts'
forkBuild.outfile = (dir = forkBuild.outdir) => path.join(dir, 'index.js')
forkBuild.args = () =>
  [__DEV__ && '--dev', __TEST__ && '--test', `--port=${__SERVER_PORT__}`].filter(v => typeof v === 'string')
