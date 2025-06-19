import { Entity, Player, ScoreboardObjective, ScoreNames, world } from '@minecraft/server'
import { expand } from 'lib/extensions/extend'
import { capitalize } from 'lib/util'

type LushWayGameModes = 'anarchy'

declare module '@minecraft/server' {
  namespace ScoreNames {
    type Stat =
      | 'blocksPlaced'
      | 'blocksBroken'
      | 'fireworksLaunched'
      | 'fireworksExpoded'
      | 'damageRecieve'
      | 'damageGive'
      | 'kills'
      | 'deaths'

    type OnlineTime = `${'total' | LushWayGameModes}OnlineTime`

    type Date = `${'lastSeen' | 'join'}Date`

    type GameModes = 'anarchy'

    type GameModesStat = `${GameModes}${Capitalize<Stat | Date>}`

    type All = 'money' | 'leafs' | 'raid' | 'pvp' | 'joinTimes' | Stat | OnlineTime | Date | GameModesStat
  }

  type ScoreName = ScoreNames.All

  interface Player {
    /** Key-number scoreboard based database. Used as a counter mostly for money/leafs/stats etc. */
    scores: Record<ScoreNames.All, number>
  }
}

export const scoreboardDisplayNames: Record<import('@minecraft/server').ScoreName, string> = {
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
  fireworksExpoded: 'Фейрверков взорвано',
  damageRecieve: 'Урона получено',
  damageGive: 'Урона нанесено',
  joinTimes: 'Всего входов на сервер',
  joinDate: 'Время первого входа',

  anarchyBlocksPlaced: 'Блоков поставлено',
  anarchyBlocksBroken: 'Блоков сломано',
  anarchyFireworksLaunched: 'Фейрверков запущено',
  anarchyFireworksExpoded: 'Фейрверков взорвано',
  anarchyDamageRecieve: 'Урона получено',
  anarchyDamageGive: 'Урона нанесено',
  anarchyKills: 'Убийств',
  anarchyDeaths: 'Смертей',

  anarchyJoinDate: 'Время первого входа на анархию',
  anarchyLastSeenDate: 'Последний раз онлайн на анархии',

  lastSeenDate: 'Последний раз онлайн',
  pvp: 'PVP',
}

const statScores: Record<ScoreNames.Stat, string> = {
  blocksPlaced: '',
  blocksBroken: '',
  fireworksLaunched: '',
  fireworksExpoded: '',
  damageRecieve: '',
  damageGive: '',
  kills: '',
  deaths: '',
}

const scorebaordStatNames = Object.keys(statScores)
export const scoreboardObjectiveNames = {
  stats: scorebaordStatNames,
  gameModeStats: scorebaordStatNames
    .map(e => `anarchy${capitalize(e)}`)
    .concat(scorebaordStatNames) as ScoreNames.GameModesStat[],
}

const untypedDisplayNames: Record<string, string> = scoreboardDisplayNames

expand(ScoreboardObjective.prototype, {
  get displayName() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (untypedDisplayNames[this.id] ?? super.displayName) as string
  },
})

const players: Record<string, { proxy: Player['scores'] }> = {}
Reflect.defineProperty(Player.prototype, 'scores', {
  configurable: false,
  enumerable: true,
  get() {
    const player = this as Player
    return ScoreboardDB.getOrCreateProxyFor(player.id)
  },
})

export class ScoreboardDB {
  static getOrCreateProxyFor(playerId: string) {
    const scoreboardPlayer = players[playerId]
    if (scoreboardPlayer) {
      return scoreboardPlayer.proxy
    } else {
      const obj: (typeof players)[string] = {
        proxy: new Proxy(
          { leafs: 0, money: 0 },
          {
            set(_, p, newValue: number) {
              if (typeof p === 'symbol')
                throw new Error(`Symbol objectives to set are not accepted, recieved ${p.description}`)

              ScoreboardDB.objective(p, untypedDisplayNames[p]).setScore(playerId, Math.round(newValue))
              return true
            },
            get(_, p) {
              if (typeof p === 'symbol')
                throw new Error(`Symbol objectives to get are not accepted, recieved ${p.description}`)

              try {
                return ScoreboardDB.objective(p, untypedDisplayNames[p]).getScore(playerId) ?? 0
              } catch (e) {
                return 0
              }
            },
          },
        ) as Player['scores'],
      }

      return (players[playerId] = obj).proxy
    }
  }

  static objectives: Record<string, ScoreboardObjective> = {}

  static objective(name: string, displayName = name) {
    if (this.objectives[name]) return this.objectives[name]

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
