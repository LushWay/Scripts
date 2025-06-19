export function setup() {
  // Determenstic test results across all enviroments
  if ('process' in globalThis) {
    // @ts-expect-error No node types installed because they pollute globals
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    process.env.TZ = 'UTC'
  }
}
