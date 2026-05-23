export function setup() {
  // Determenstic test results across all enviroments
  if ('process' in globalThis) {
    // @ts-expect-error No node types installed because they pollute globals
    process.env.TZ = 'UTC'
  }
}
