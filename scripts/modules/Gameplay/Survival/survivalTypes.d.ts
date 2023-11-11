declare module '@minecraft/server' {
  interface PlayerDatabase {
    survival: {
      anarchy?: Vector3
      inv: 'anarchy' | 'spawn' | 'mg'
    }
  }
}

export {}
