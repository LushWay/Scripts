declare global {
  // Global variables injected
  const __DEV__: boolean
  const __PRODUCTION__: boolean
  const __SERVER__: boolean
  const __TEST__: boolean
  const __RELEASE__: boolean
  const __SERVER_PORT__: string
  const __VITEST__: boolean
  const __GIT__: string
}

export {}
