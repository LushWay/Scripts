export function setup() {
  // Determenstic test results across all enviroments
  if ('process' in globalThis) {
    process.env.TZ = 'UTC'
  }
}
