import { Player, world } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { OverTakes } from 'lib/Extensions/OverTakes'

export const PLAYER_DB = new DynamicPropertyDB('player', {
  /** @type {Record<string, import("@minecraft/server").Player["database"]>} */
  type: {},
  /**
   * @returns {import("@minecraft/server").Player["database"]}
   */
  defaultValue: () => {
    return {
      role: 'member',
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

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  if (player.database.name && player.database.name !== player.name) {
    const message = '§e> §3Игрок §f' + player.database.name + ' §r§3сменил ник на §f' + player.name

    world.say(message)
    console.warn(message)
  }

  player.database.name = player.name
})
