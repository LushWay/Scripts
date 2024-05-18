import { Entity, EntityLifetimeState, Player, ScoreboardObjective, system, world } from '@minecraft/server'
import { CUSTOM_ENTITIES } from 'lib/assets/config'
import { ProxyDatabase } from 'lib/database/proxy'
import { util } from 'lib/util'
import { Vector } from 'lib/vector'
import { table } from './database/abstract'

export interface LeaderboardInfo {
  style: keyof typeof Leaderboard.styles
  objective: string
  displayName: string
  location: Vector3
  dimension: Dimensions
}

export class Leaderboard {
  static db = table<LeaderboardInfo>('leaderboard')

  static tag = 'LEADERBOARD'

  static entityId = CUSTOM_ENTITIES.floatingText

  static parseCustomScore(scoreboardId: string, score: number, convertToMetricNumbers = false) {
    if (scoreboardId.endsWith('Time')) {
      const time = util.ms.remaining(score, { converters: ['ms', 'sec', 'min', 'hour'] })

      return `${time.value} ${time.type}`
    } else if (scoreboardId.endsWith('Date')) {
      return new Date(score * 1000).format()
    }

    if (convertToMetricNumbers) {
      return toMetricNumbers(score)
    } else return score
  }

  static styles = {
    gray: {
      objName: '7',
      fill1: '7',
      fill2: 'f',
      pos: '7',
      nick: 'f',
      score: '7',
    },
    white: {
      objName: 'ф',
      fill1: 'ф',
      fill2: 'ф',
      pos: 'ф',
      nick: 'ф',
      score: 'ф',
    },
    green: {
      objName: 'a',
      fill1: '2',
      fill2: '3',
      pos: 'a',
      nick: 'f',
      score: 'a',
    },
  }

  static all = new Map<string, Leaderboard>()

  static createLeaderboard({
    objective,
    location,
    dimension = 'overworld',
    style = 'green',
    displayName = objective,
  }: LeaderboardInfo) {
    const entity = world.getDimension(dimension).spawnEntity(Leaderboard.entityId, Vector.floor(location))
    entity.nameTag = 'Updating...'
    entity.addTag(Leaderboard.tag)

    return new Leaderboard(entity, {
      style,
      objective,
      location,
      dimension,
      displayName,
    })
  }

  /** Creates manager of Leaderboard */
  constructor(
    public entity: Entity,
    public info: LeaderboardInfo,
  ) {
    const previous = Leaderboard.all.get(entity.id)
    if (previous) return previous

    this.update()
    Leaderboard.all.set(entity.id, this)
  }

  remove() {
    Reflect.deleteProperty(Leaderboard.db, this.entity.id)
    Leaderboard.all.delete(this.entity.id)
    this.entity.remove()
  }

  update() {
    Leaderboard.db[this.entity.id] = this.info
  }

  private objective: ScoreboardObjective

  set scoreboard(v) {
    this.objective = v
  }

  get scoreboard() {
    return (
      this.objective ??
      (this.objective =
        world.scoreboard.getObjective(this.info.objective) ??
        world.scoreboard.addObjective(this.info.objective, this.info.displayName))
    )
  }

  updateLeaderboard() {
    const scoreboard = this.scoreboard
    const dname = scoreboard.displayName
    const name = dname.charAt(0).toUpperCase() + dname.slice(1)
    const style = Leaderboard.styles[this.info.style] ?? Leaderboard.styles.gray
    const filler = `§${style.fill1}-§${style.fill2}-`.repeat(10)

    let leaderboard = ``
    for (const [i, scoreInfo] of scoreboard
      .getScores()

      .sort((a, b) => b.score - a.score)

      .filter((_, i) => i < 10)
      .entries()) {
      const { pos: t, nick: n, score: s } = style

      const name =
        Player.name(scoreInfo.participant?.displayName) ?? scoreInfo.participant?.displayName ?? '§8<Unknown player>'

      leaderboard += `§ы§${t}#${i + 1}§r `
      leaderboard += `§${n}${name}§r `
      leaderboard += `§${s}${Leaderboard.parseCustomScore(this.scoreboard.id, scoreInfo.score, true)}§r\n`
    }

    if (this.entity.isValid()) this.entity.nameTag = `§ы§l§${style.objName}${name}\n§ы§l${filler}§r\n${leaderboard}`
  }
}

const immutable = ProxyDatabase.immutableUnproxy(Leaderboard.db)
system.runInterval(
  () => {
    for (const [id, leaderboard] of Object.entries(immutable)) {
      if (!leaderboard) continue
      const info = Leaderboard.all.get(id)

      if (info) {
        if (info.entity.lifetimeState === EntityLifetimeState.Unloaded) continue
        info.updateLeaderboard()
      } else {
        const entity = world[leaderboard.dimension]
          .getEntities({
            location: leaderboard.location,
            tags: [Leaderboard.tag],
            type: Leaderboard.entityId,
          })

          .find(e => e.id === id)

        if (!entity || entity.lifetimeState === EntityLifetimeState.Unloaded || !leaderboard) continue
        new Leaderboard(entity, leaderboard).updateLeaderboard()
      }
    }
  },
  'leaderboardsInterval',
  40,
)

/**
 * This will display in text in thousands, millions and etc... For ex: "1400 -> "1.4k", "1000000" -> "1M", etc...
 *
 * @example
 *   metricNumbers(15000)
 *
 * @param {number} value The number you want to convert
 * @returns {string}
 */
function toMetricNumbers(value: number): string {
  const types = ['', 'к', 'млн', 'млрд', 'трлн']
  const exp = (Math.log10(value) / 3) | 0

  if (exp === 0) return value.toString()

  const scaled = value / Math.pow(10, exp * 3)
  return `${scaled.toFixed(1)}${exp > 5 ? 'e' + exp : types[exp]}`
}
