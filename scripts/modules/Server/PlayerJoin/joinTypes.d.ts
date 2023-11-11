declare global {
  interface IJoinData {
    name?: string | undefined
    waiting?: 1 | undefined
    at?: number[]
    stage?: number
    times?: number
    learning?: 1 | undefined
    message?: 1 | undefined
    joined?: number
  }
}

declare module '@minecraft/server' {
  interface PlayerDatabase {
    join: IJoinData
  }
}

export {}
