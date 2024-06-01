import { Player, world, type PlayerDatabase } from '@minecraft/server'
import { expand } from 'lib/extensions/extend'
import { table } from './abstract'

declare module '@minecraft/server' {
  namespace Player {
    /** Link to the global defined player database. See more here {@link table} */
    const database: Record<string, PlayerDatabase>

    /**
     * Gets player name from the {@link Player.database} by id
     *
     * If the id is undefined or name not found, undefined is returned
     *
     * @example
     *   Player.nameById(playerId) // Shp1nat9841
     */
    function name(id: string): string | undefined
  }

  interface Player {
    /**
     * Key-value database alias that works like an ordinary javascript object, see more here {@link table}
     *
     * @example
     *   player.database.name // Access like regular property
     *
     *   player.database.value = 34 // Assign like regular property
     *
     *   player.survival.inventory = 'home' // Nested objects are allowed too!
     */
    database: PlayerDatabase
  }
}

expand(Player, {
  database: table<PlayerDatabase>('player', () => ({
    role: __RELEASE__ ? 'member' : 'spectator',
    inv: 'spawn',
    survival: {},
  })),
  name(id) {
    if (!id) return void 0

    return Player.database[id].name
  },
})

Object.defineProperty(Player.prototype, 'database', {
  enumerable: true,
  configurable: false,
  get(this: Player) {
    return Player.database[this.id]
  },
})

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn) return
  if (player.database.name && player.database.name !== player.name) {
    const message = '§e> §3Игрок §f' + player.database.name + ' §r§3сменил ник на §f' + player.name

    world.say(message)
    console.warn(message)
  }

  player.database.name = player.name
})
