/** @param {Omit<import('./build/cli.js').BuildArgs, 'outfile' | 'outdir' | 'entry'>} args */
export function generateDefine({ dev, test, world, port, vitest }) {
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
    }).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]),
  )
}
