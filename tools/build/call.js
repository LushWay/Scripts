import child_process from 'child_process'
import path from 'path'

/** @typedef {import('../defines.js')} A */

export function build() {
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
      outdir: (outdir = build.outdir) => ({
        args: (args = build.args()) => ({
          /**
           * Adds callback that will be called when initial build finishes
           *
           * @param {(outfile: string) => void} onReady
           */
          onReady: onReady => ({
            /**
             * @param {undefined | ((this: void, changedFile: string) => void)} onReload - Will be called on reload in
             *   watch mode
             * @returns {Promise<import('child_process').ChildProcess>} - Resolves with build process
             */
            onWatchModeUpdate: onReload =>
              new Promise((resolve, reject) => {
                args = args.concat(`--outdir=${outdir}`, entry ? `--entry=${entry}` : '').filter(Boolean)
                console.log('aaaa')
                const p = child_process
                  .fork('tools/build.js', args, { cwd, stdio: 'inherit', execArgv: [] })
                  .on('message', message => {
                    if (message === 'ready') onReady(build.outfile(outdir)), resolve(p)
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
