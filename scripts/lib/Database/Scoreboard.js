import { Entity, Player, ScoreboardObjective, world } from '@minecraft/server'

/**
 * @type {Record<string, {player: Player, proxy: any}>}
 */
const players = {}
Reflect.defineProperty(Player.prototype, 'scores', {
  configurable: false,
  enumerable: true,
  get() {
    /** @type {Player} */
    const player = this

    if (players[player.id]) {
      if (!players[player.id].player.isValid())
        players[player.id].player = player

      return players[player.id].proxy
    } else {
      /** @type {(typeof players)[string]} */
      const obj = {
        player,
        proxy: new Proxy(
          {
            leafs: 0,
            money: 0,
          },
          {
            set(_, p, newValue) {
              if (typeof p === 'symbol')
                throw new Error('Symbol objectives are not accepted')

              if (!obj.player.scoreboardIdentity)
                obj.player.runCommand(`scoreboard players set @s ${p} 0`)

              ScoreboardDB.objective(p).setScore(obj.player, newValue)
              return true
            },
            get(_, p) {
              if (typeof p === 'symbol')
                throw new Error('Symbol objectives are not accepted')

              if (!obj.player.scoreboardIdentity) return 0
              return ScoreboardDB.objective(p).getScore(obj.player) ?? 0
            },
          }
        ),
      }

      return (players[player.id] = obj)
    }
  },
})

export class ScoreboardDB {
  /**
   * Gets entity.scroebaordIdentity or creates if not exists
   * @param {Entity} entity
   */
  static ID(entity) {
    return (
      entity.scoreboardIdentity ??
      (entity.runCommand(`scoreboard players set @s "${this.name}" 0`),
      entity.scoreboardIdentity)
    )
  }

  /**
   *
   * @param {string} name
   */
  static objective(name, displayName = name) {
    if (name in this.objectives) return this.objectives[name]

    return (this.objectives[name] =
      world.scoreboard.getObjective(name) ??
      world.scoreboard.addObjective(name, displayName))
  }

  /**
   * @type {Record<string, ScoreboardObjective>}
   */
  static objectives = {}

  /**
   * @param {string} name
   * @param {string} [displayName]
   */
  constructor(name, displayName = name) {
    if (name.length > 16) name = name.substring(0, 16)

    this.name = name
    this.scoreboard = ScoreboardDB.objective(name, displayName)
  }
  /**
   *
   * @param {Entity} entity
   * @param {number} value
   */
  set(entity, value) {
    const id = ScoreboardDB.ID(entity)
    if (!id) return

    this.scoreboard.setScore(id, value)
  }
  /**
   *
   * @param {Entity} entity
   * @param {number} value
   */
  add(entity, value) {
    const id = ScoreboardDB.ID(entity)
    if (!id) return

    this.scoreboard.setScore(id, this.get(entity) + value)
  }
  /**
   *
   * @param {Entity} entity
   * @returns {number}
   */
  get(entity) {
    if (!entity.scoreboardIdentity) return 0
    return this.scoreboard.getScore(entity.scoreboardIdentity) ?? 0
  }

  reset() {
    world.overworld.runCommand(`scoreboard players reset * ${this.name}`)
  }
}

/*
const objective = new ScoreboardDB('objectiveName', 'display name')

const score = objective.get(player)
objective.set(player, 1)
objective.add(player, 1)

objective.nameSet('custom name', 1)
objective.nameGet('custom name')

objective.reset()
*/
