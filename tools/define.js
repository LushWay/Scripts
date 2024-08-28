import ch from 'child_process'

/** @param {Omit<import('./build/cli.js').BuildArgs, 'outfile' | 'outdir' | 'entry'>} args */
export function generateDefine({ dev, test, world, port, vitest }) {
  let git = ''
  if (!dev && !vitest)
    try {
      git = 'Commit: ' + ch.execSync('git log --abbrev-commit --pretty=reference -n 1').toString().trim()
    } catch {}

  return Object.fromEntries(
    Object.entries({
      __DEV__: dev,
      __PRODUCTION__: !dev,
      __RELEASE__: false,
      __TEST__: test,
      __VITEST__: vitest,
      __SERVER__: !world,
      __SERVER_PORT__: port,
      __ESBUILD__: true,
      __GIT__: git,
    }).map(([key, value]) => [key, JSON.stringify(value)]),
  )
}
