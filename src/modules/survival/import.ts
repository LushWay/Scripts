import '../features/import'
import '../places/import'

import '../quests/index'
import './stats'

import './death-quest-and-gravestone'
import './menu'
import './random-teleport'
import './realtime'
import './sidebar'
import './cleanup'

declare module '@minecraft/server' {
  interface PlayerDatabase {
    inv: InventoryTypeName
    survival: {
      /** Whenether player is newbie or not */
      newbie?: 1

      /** Whenether player has elytra in their inventory or not */
      rtpElytra?: 1

      /** Player anarchy position */
      anarchy?: Vector3

      deadAt?: Vector3

      gravestoneId?: string
    }
  }
}

declare global {
  type InventoryTypeName = 'anarchy' | 'spawn' | 'mg'
}
