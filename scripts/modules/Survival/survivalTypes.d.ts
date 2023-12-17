declare module '@minecraft/server' {
  interface PlayerDatabase {
    survival: {
      anarchy?: Vector3
      inv: InventoryTypeName
      rtpElytra?: 1
    }
  }
}

declare global {
  type InventoryTypeName = 'anarchy' | 'spawn' | 'mg'
}

export {}
