declare module '@minecraft/server' {
  interface PlayerDatabase {
    server?: {
      invs: Record<string, string>
    }
  }
}

export {}
