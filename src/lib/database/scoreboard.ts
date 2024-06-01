import { Entity, Player, ScoreboardObjective, world } from '@minecraft/server'
import { expand } from 'lib/extensions/extend'
import { util } from 'lib/util'

declare module '@minecraft/server' {
  type GameplayStatScoreName =
    | 'blocksPlaced'
    | 'blocksBroken'
    | 'fireworksLaunched'
    | 'fireworksExpoded'
    | 'damageRecieve'
    | 'damageGive'
    | 'kills'
    | 'deaths'

  type TimeStatScoreName = `${'total' | 'anarchy'}OnlineTime`

  type DateStatScoreName = `${'lastSeen' | 'join'}Date`

  type StatScoreName = GameplayStatScoreName | TimeStatScoreName | DateStatScoreName

  type ScoreName = 'money' | 'leafs' | 'raid' | 'pvp' | 'joinTimes' | StatScoreName

  interface Player {
    /** Key-number scoreboard based database. Used as a counter mostly for money/leafs/stats etc. */
    scores: Record<ScoreName, number>
  }
}

const displayNames: Record<import('@minecraft/server').ScoreName, string> = {
  leafs: '§aЛистья',
  money: '§6Монеты',
  kills: 'Убийств',
  deaths: 'Смертей',
  raid: 'Рейд-блок',
  totalOnlineTime: 'Онлайн всего',
  anarchyOnlineTime: 'Онлайн на анархии',
  blocksPlaced: 'Блоков поставлено',
  blocksBroken: 'Блоков сломано',
  fireworksLaunched: 'Фейрверков запущено',
  fireworksExpoded: 'Фейрвереов взорвано',
  damageRecieve: 'Урона получено',
  damageGive: 'Урона нанесено',
  joinTimes: 'Всего входов на сервер',
  joinDate: 'Время первого входа',

  lastSeenDate: 'Последний раз онлайн',
  pvp: 'PVP',
}
const untypedDisplayNames: Record<string, string> = displayNames

expand(ScoreboardObjective.prototype, {
  get displayName() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (untypedDisplayNames[this.id] ?? super.displayName) as string
  },
})

const players: Record<string, { player: Player; proxy: unknown }> = {}
Reflect.defineProperty(Player.prototype, 'scores', {
  configurable: false,
  enumerable: true,
  get() {
    const player = this as Player

    if (typeof players[player.id] !== 'undefined') {
      let valid = false
      try {
        valid = players[player.id].player.isValid()
      } catch {}

      if (!valid) players[player.id].player = player

      return players[player.id].proxy
    } else {
      const obj: (typeof players)[string] = {
        player,
        proxy: new Proxy(
          {
            leafs: 0,
            money: 0,
          },
          {
            set(_, p, newValue: number) {
              if (typeof p === 'symbol')
                throw new Error('Symbol objectives to set are not accepted, recieved ' + util.stringify(p))

              ScoreboardDB.objective(p, untypedDisplayNames[p]).setScore(obj.player.id, Math.round(newValue))
              return true
            },
            get(_, p) {
              if (typeof p === 'symbol')
                throw new Error(`Symbol objectives to get are not accepted, recieved ${p.description}`)

              try {
                return ScoreboardDB.objective(p, untypedDisplayNames[p]).getScore(obj.player.id) ?? 0
              } catch (e) {
                return 0
              }
            },
          },
        ),
      }

      return (players[player.id] = obj).proxy
    }
  },
})

export class ScoreboardDB {
  static objectives: Record<string, ScoreboardObjective> = {}

  static objective(name: string, displayName = name) {
    if (name in this.objectives) return this.objectives[name]

    const objective = (this.objectives[name] =
      world.scoreboard.getObjective(name) ?? world.scoreboard.addObjective(name, displayName))

    return objective
  }

  scoreboard

  constructor(
    public name: string,
    displayName: string = name,
  ) {
    if (name.length > 16) name = name.substring(0, 16)

    this.scoreboard = ScoreboardDB.objective(name, displayName)
  }

  /**
   * @param {Entity | string} id
   * @param {number} value
   */
  set(id: Entity | string, value: number) {
    if (typeof id !== 'string') id = id.id
    this.scoreboard.setScore(id, value)
  }

  /**
   * @param {Entity | string} id
   * @param {number} value
   */
  add(id: Entity | string, value: number) {
    if (typeof id !== 'string') id = id.id
    this.scoreboard.setScore(id, this.get(id) + value)
  }

  /**
   * @param {Entity | string} id
   * @returns {number}
   */
  get(id: Entity | string): number {
    if (typeof id !== 'string') id = id.id
    try {
      return this.scoreboard.getScore(id) ?? 0
    } catch (e) {
      return 0
    }
  }

  reset() {
    this.scoreboard.getParticipants().forEach(e => this.scoreboard.removeParticipant(e))
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
