import { Entity, Player, ScoreboardObjective, ScoreNames, world } from '@minecraft/server'
import { expand } from 'lib/extensions/extend'
import { capitalize } from 'lib/util'

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

    type GameModes = 'anarchy'

    type OnlineTime = `${'total' | GameModes}OnlineTime`

    type Date = `${'lastSeen' | 'join'}Date`

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
  blocksPlaced: 'Блоков поставлено',
  blocksBroken: 'Блоков сломано',
  fireworksLaunched: 'Фейрверков запущено',
  fireworksExpoded: 'Фейрверков взорвано',
  damageRecieve: 'Урона получено',
  damageGive: 'Урона нанесено',
  joinTimes: 'Всего входов на сервер',
  joinDate: 'Время первого входа',

  anarchyOnlineTime: 'Онлайн на анархии',
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

const scoreboardStatNames = Object.keys(statScores)
export const scoreboardObjectiveNames = {
  stats: scoreboardStatNames,
  gameModeStats: scoreboardStatNames
    .map(e => `anarchy${capitalize(e)}`)
    .concat(scoreboardStatNames) as ScoreNames.GameModesStat[],
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
  static defineName(id: string, name: string) {
    untypedDisplayNames[id] = name
  }

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

  private static objectives = new Map<string, ScoreboardObjective>()

  static objective(id: string, displayName = id) {
    let objective = this.objectives.get(id)
    if (!objective) {
      objective = world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id, displayName)
      this.objectives.set(id, objective)
    }

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

  set(id: Entity | string, value: number) {
    if (typeof id !== 'string') id = id.id
    this.scoreboard.setScore(id, value)
  }

  add(id: Entity | string, value: number) {
    if (typeof id !== 'string') id = id.id
    this.scoreboard.setScore(id, this.get(id) + value)
  }

  get(id: Entity | string): number {
    if (typeof id !== 'string') id = id.id
    try {
      return this.scoreboard.getScore(id) ?? 0
    } catch (e) {
      return 0
    }
  }
}
