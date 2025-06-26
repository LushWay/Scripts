import { Entity, Player, ScoreboardObjective, ScoreNames, world } from '@minecraft/server'
import { defaultLang } from 'lib/assets/lang'
import { expand } from 'lib/extensions/extend'
import { i18nShared } from 'lib/i18n/text'
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

export const scoreboardDisplayNames: Record<import('@minecraft/server').ScoreName, SharedText> = {
  leafs: i18nShared`§aЛистья`,
  money: i18nShared`§6Монеты`,
  kills: i18nShared`Убийств`,
  deaths: i18nShared`Смертей`,
  raid: i18nShared`Рейд-блок`,
  totalOnlineTime: i18nShared`Онлайн всего`,
  blocksPlaced: i18nShared`Блоков поставлено`,
  blocksBroken: i18nShared`Блоков сломано`,
  fireworksLaunched: i18nShared`Фейрверков запущено`,
  fireworksExpoded: i18nShared`Фейрверков взорвано`,
  damageRecieve: i18nShared`Урона получено`,
  damageGive: i18nShared`Урона нанесено`,
  joinTimes: i18nShared`Всего входов на сервер`,
  joinDate: i18nShared`Время первого входа`,

  anarchyOnlineTime: i18nShared`Онлайн на анархии`,
  anarchyBlocksPlaced: i18nShared`Блоков поставлено`,
  anarchyBlocksBroken: i18nShared`Блоков сломано`,
  anarchyFireworksLaunched: i18nShared`Фейрверков запущено`,
  anarchyFireworksExpoded: i18nShared`Фейрверков взорвано`,
  anarchyDamageRecieve: i18nShared`Урона получено`,
  anarchyDamageGive: i18nShared`Урона нанесено`,
  anarchyKills: i18nShared`Убийств`,
  anarchyDeaths: i18nShared`Смертей`,

  anarchyJoinDate: i18nShared`Время первого входа на анархию`,
  anarchyLastSeenDate: i18nShared`Последний раз онлайн на анархии`,

  lastSeenDate: i18nShared`Последний раз онлайн`,
  pvp: i18nShared`PVP`,
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

const untypedDisplayNames: Record<string, SharedText> = scoreboardDisplayNames

expand(ScoreboardObjective.prototype, {
  get displayName() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (untypedDisplayNames[this.id ?? '']?.to(defaultLang) ?? super.displayName) as string
  },
})

const players: Record<string, { proxy: Player['scores'] }> = {}
Reflect.defineProperty(Player.prototype, 'scores', {
  configurable: true,
  enumerable: true,
  get() {
    const player = this as Player
    return ScoreboardDB.getOrCreateProxyFor(player.id)
  },
})

export class ScoreboardDB {
  static getName(o: ScoreboardObjective | string) {
    const id = typeof o === 'string' ? o : o.id
    return untypedDisplayNames[id] ?? (o instanceof ScoreboardObjective ? o.displayName : id)
  }

  static defineName(id: string, name: SharedText) {
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

              ScoreboardDB.objective(p, untypedDisplayNames[p]?.to(defaultLang)).setScore(
                playerId,
                Math.round(newValue),
              )
              return true
            },
            get(_, p) {
              if (typeof p === 'symbol')
                throw new Error(`Symbol objectives to get are not accepted, recieved ${p.description}`)

              try {
                return ScoreboardDB.objective(p, untypedDisplayNames[p]?.to(defaultLang)).getScore(playerId) ?? 0
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
    public id: string,
    displayName: string = id,
  ) {
    this.scoreboard = ScoreboardDB.objective(id, displayName)
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
