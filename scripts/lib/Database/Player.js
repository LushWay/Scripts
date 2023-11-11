import { Player } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { OverTakes } from 'xapi.js'

export const PLAYER_DB = new DynamicPropertyDB('player', {
  /** @type {Record<string, any>} */
  type: {},
  /**
   * @returns {import("@minecraft/server").Player["database"]}
   */
  defaultValue: () => {
    return {
      join: {
        learning: 1,
        joined: Date.now(),
      },
      survival: {
        inv: 'spawn',
      },
    }
  },
}).proxy()

Object.defineProperty(Player.prototype, 'database', {
  enumerable: true,
  configurable: false,
  get() {
    return PLAYER_DB[this.id]
  },
})

OverTakes(Player, {
  name(id) {
    return PLAYER_DB[id].name
  },
})
