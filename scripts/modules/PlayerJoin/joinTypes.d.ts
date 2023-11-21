declare global {
  interface JoinProperty {
    name?: string | undefined
    position?: number[]
    stage?: number
    times?: number
    joined?: number
  }
}

declare module '@minecraft/server' {
  interface PlayerDatabase {
    join: JoinProperty
  }
}

export {}
