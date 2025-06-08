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
import './recurring-events'

import type { VectorInDimension } from 'lib/utils/point'

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

      deadAt2?: VectorInDimension

      gravestoneId?: string
    }
  }
}

declare global {
  type InventoryTypeName = 'anarchy' | 'spawn' | 'mg'
}
