import '../places/anarchy/anarchy'
import '../places/spawn'
import '../places/stone-quarry/stone-quarry'
import '../places/tech-city/tech-city'
import '../places/village-of-explorers/village-of-explorers'
import '../places/village-of-miners/village-of-miners'

import '../features/import'

import '../quests/index'
import './stats'

import './death-quest-and-gravestone'
import './menu'
import './random-teleport'
import './realtime'
import './sidebar'

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

      doNotSaveAnarchy?: 1

      deadAt?: Vector3
    }
  }
}

declare global {
  type InventoryTypeName = 'anarchy' | 'spawn' | 'mg'
}
