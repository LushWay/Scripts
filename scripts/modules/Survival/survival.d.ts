declare module '@minecraft/server' {
  interface PlayerDatabase {
    inv: InventoryTypeName
    survival: {
      /**
       * Whenether player is newbie or not
       */
      newbie?: 1

      /**
       * Whenether player has elytra in their inventory or not
       */
      rtpElytra?: 1

      /**
       * Notice about placing/breaking blocks outside of region will be restored
       */
      bn?: 1

      /**
       * Player anarchy position
       */
      anarchy?: Vector3

      deadAt?: Vector3
    }
  }
}

declare global {
  type InventoryTypeName = 'anarchy' | 'spawn' | 'mg'
}

export {}
