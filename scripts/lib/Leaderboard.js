import { Entity, EntityLifetimeState, Player, ScoreboardObjective, Vector, system, world } from '@minecraft/server'
import { CUSTOM_ENTITIES } from 'config.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { util } from 'lib/util.js'

/**
 * @typedef {{
 *   style: keyof typeof Leaderboard.styles;
 *   objective: string;
 *   displayName: string
 *   location: Vector3;
 *   dimension: Dimensions
 * }} LeaderboardInfo
 */

export class Leaderboard {
  static db = new DynamicPropertyDB('leaderboard', {
    /** @type {Record<string, LeaderboardInfo>} */
    type: {},
  }).proxy()
  static tag = 'LEADERBOARD'
  static entityId = CUSTOM_ENTITIES.floatingText
  /**
   *
   * @param {string} scoreboardId
   * @param {number} score
   */
  static parseCustomScore(scoreboardId, score, convertToMetricNumbers = false) {
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
  /**
   * @type {Record<string, Leaderboard>}
   */
  static all = {}
  /**
   *
   * @param {LeaderboardInfo} data
   */
  static createLeaderboard({ objective, location, dimension = 'overworld', style = 'green', displayName = objective }) {
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
  /**
   * Creates manager of Leaderboard
   * @param {Entity} entity
   * @param {LeaderboardInfo} data
   */
  constructor(entity, data) {
    if (entity.id in Leaderboard.all) return Leaderboard.all[entity.id]

    /** @type {Entity} */
    this.entity = entity
    /** @type {LeaderboardInfo} */
    this.data = data
    this.update()
    Leaderboard.all[entity.id] = this
  }
  remove() {
    delete Leaderboard.db[this.entity.id]
    delete Leaderboard.all[this.entity.id]
    this.entity.remove()
  }
  update() {
    Leaderboard.db[this.entity.id] = this.data
  }

  /** @type {ScoreboardObjective | undefined} */
  #scoreboard
  set scoreboard(v) {
    this.#scoreboard = v
  }
  get scoreboard() {
    return (
      this.#scoreboard ??
      (this.#scoreboard =
        world.scoreboard.getObjective(this.data.objective) ??
        world.scoreboard.addObjective(this.data.objective, this.data.displayName))
    )
  }
  updateLeaderboard() {
    const scoreboard = this.scoreboard
    const dname = scoreboard.displayName
    const name = dname.charAt(0).toUpperCase() + dname.slice(1)
    const style = Leaderboard.styles[this.data.style] ?? Leaderboard.styles.gray
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

const immutable = DynamicPropertyDB.immutableUnproxy(Leaderboard.db)
system.runInterval(
  () => {
    for (const [id, leaderboard] of Object.entries(immutable)) {
      const LB = Leaderboard.all[id]

      if (LB) {
        if (LB.entity.lifetimeState === EntityLifetimeState.Unloaded) continue
        LB.updateLeaderboard()
      } else {
        const entity = world[leaderboard.dimension]
          .getEntities({
            location: leaderboard.location,
            tags: [Leaderboard.tag],
            type: Leaderboard.entityId,
          })
          .find(e => e.id === id)

        if (!entity || entity.lifetimeState === EntityLifetimeState.Unloaded) continue
        new Leaderboard(entity, leaderboard).updateLeaderboard()
      }
    }
  },
  'leaderboardsInterval',
  40
)

/**
 * This will display in text in thousands, millions and etc... For ex: "1400 -> "1.4k", "1000000" -> "1M", etc...
 * @param {number} value The number you want to convert
 * @returns {string}
 * @example metricNumbers(15000);
 */
function toMetricNumbers(value) {
  const types = ['', 'к', 'млн', 'млрд', 'трлн']
  const exp = (Math.log10(value) / 3) | 0

  if (exp === 0) return value.toString()

  const scaled = value / Math.pow(10, exp * 3)
  return `${scaled.toFixed(1)}${exp > 5 ? 'e' + exp : types[exp]}`
}
