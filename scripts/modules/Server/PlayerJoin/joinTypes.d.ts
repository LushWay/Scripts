declare module '@minecraft/server' {
  interface PlayerDatabase {
    join?: {
      position?: number[]
      stage?: number
    }
    name?: string | undefined
  }
}

export {}
