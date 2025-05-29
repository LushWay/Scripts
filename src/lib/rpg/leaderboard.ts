import { Entity, Player, ScoreboardObjective, system, world } from '@minecraft/server'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { t } from 'lib/text'
import { Vec } from 'lib/vector'
import { table } from '../database/abstract'

export interface LeaderboardInfo {
  style: keyof typeof Leaderboard.styles
  objective: string
  displayName: string
  location: Vector3
  dimension: DimensionType
}

export class Leaderboard {
  static db = table<LeaderboardInfo>('leaderboard')

  static tag = 'LEADERBOARD'

  static entityId = CustomEntityTypes.FloatingText

  static parseCustomScore(scoreboardId: string, score: number, convertToMetricNumbers = false) {
    if (scoreboardId.endsWith('Time')) {
      return t.time`${score}`
    } else if (scoreboardId.endsWith('Date')) {
      return new Date(score * 1000).format()
    }

    if (convertToMetricNumbers) {
      return toMetricNumbers(score)
    } else return score
  }

  static styles = {
    gray: { objName: '7', fill1: '7', fill2: 'f', pos: '7', nick: 'f', score: '7' },
    white: { objName: 'f', fill1: 'f', fill2: 'f', pos: 'f', nick: 'f', score: 'f' },
    green: { objName: 'a', fill1: '2', fill2: '3', pos: 'a', nick: 'f', score: 'a' },
  }

  static all = new Map<string, Leaderboard>()

  static createLeaderboard({
    objective,
    location,
    dimension = 'overworld',
    style = 'green',
    displayName = objective,
  }: LeaderboardInfo) {
    const entity = world.getDimension(dimension).spawnEntity(Leaderboard.entityId, Vec.floor(location))
    entity.nameTag = 'Updating...'
    entity.addTag(Leaderboard.tag)

    return new Leaderboard(entity, { style, objective, location, dimension, displayName })
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
    Leaderboard.db.set(this.entity.id, this.info)
  }

  private objective?: ScoreboardObjective

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
    type Nullable<T> = T | null

    const scoreboard = this.scoreboard
    const dname = scoreboard.displayName
    const name = dname.charAt(0).toUpperCase() + dname.slice(1)
    const style =
      (Leaderboard.styles[this.info.style] as Nullable<ValueOf<typeof Leaderboard.styles>>) ?? Leaderboard.styles.gray
    const filler = `§${style.fill1}-§${style.fill2}-`.repeat(10)

    let leaderboard = ``
    for (const [i, scoreInfo] of scoreboard
      .getScores()

      .sort((a, b) => b.score - a.score)

      .filter((_, i) => i < 10)
      .entries()) {
      const { pos: t, nick: n, score: s } = style

      const name =
        ((Player.name(scoreInfo.participant.displayName) ?? scoreInfo.participant.displayName) as string | undefined) ??
        '§8<Unknown player>'

      leaderboard += `§ы§${t}#${i + 1}§r `
      leaderboard += `§${n}${name}§r `
      leaderboard += `§${s}${Leaderboard.parseCustomScore(this.scoreboard.id, scoreInfo.score, true)}§r\n`
    }

    if (this.entity.isValid) this.entity.nameTag = `§ы§l§${style.objName}${name}\n§ы§l${filler}§r\n${leaderboard}`
  }
}

system.runInterval(
  () => {
    for (const [id, leaderboard] of Leaderboard.db.entriesImmutable()) {
      if (typeof leaderboard === 'undefined') continue
      const info = Leaderboard.all.get(id)

      if (info) {
        if (info.entity.isValid) {
          info.updateLeaderboard()
        }
      } else {
        const entity = world[leaderboard.dimension]
          .getEntities({ location: leaderboard.location, tags: [Leaderboard.tag], type: Leaderboard.entityId })
          .find(e => e.id === id)

        if (!entity || !entity.isValid || typeof leaderboard === 'undefined') continue
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
  return `${scaled.toFixed(1)}${exp > 5 ? `e${exp}` : types[exp]}`
}
