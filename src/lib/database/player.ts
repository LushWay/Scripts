import { Player, PlayerDatabase, world } from '@minecraft/server'
import { expand } from 'lib/extensions/extend'
import { table } from './abstract'

declare module '@minecraft/server' {
  namespace Player {
    /** Link to the global defined player database. See more here {@link table} */
    const database: Record<string, PlayerDatabase>

    /**
     * Searches online player by ID
     *
     * @param id - Player ID
     */
    function getById(id: string): Player | undefined
    /**
     * Searches online player by name
     *
     * **CAUTION**: You should ALWAYS prefer using `getById` because of security purposes. Minecraft is weird with how
     * it handles names, e.g. they can be changed, spoofed etc. So you totally should NOT depend on player name or
     * search player by it, unless the player is searching other player.
     *
     * @param name - Player name to search for
     */
    function getByName(name: string): Player | undefined

    /**
     * Gets player name from the {@link Player.database} by id
     *
     * If the id is undefined or name not found, undefined is returned
     *
     * @example
     *   Player.id(playerId) // Shp1nat9841
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
  name(id) {
    if (!id) return void 0

    return Player.database[id].name
  },
  database: table<PlayerDatabase>('player', () => ({
    role: __PRODUCTION__ ? 'member' : 'spectator',
    inv: 'spawn',
    survival: {},
  })),
})

Object.defineProperty(Player.prototype, 'database', {
  enumerable: true,
  configurable: false,
  get() {
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
