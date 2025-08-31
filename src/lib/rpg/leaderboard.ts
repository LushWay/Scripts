import {
  Entity,
  Player,
  RawMessage,
  RawText,
  ScoreboardObjective,
  ScoreboardScoreInfo,
  system,
  world,
} from '@minecraft/server'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { defaultLang } from 'lib/assets/lang'
import { scoreboardDisplayNames } from 'lib/database/scoreboard'
import { i18n, i18nShared } from 'lib/i18n/text'
import { isKeyof } from 'lib/util'
import { Vec } from 'lib/vector'
import { table } from '../database/abstract'

export interface LeaderboardInfo {
  style: keyof typeof Leaderboard.styles
  objective: string
  displayName: string
  location: Vector3
  dimension: DimensionType
}

const biggest = (a: ScoreboardScoreInfo, b: ScoreboardScoreInfo) => b.score - a.score
const smallest = (a: ScoreboardScoreInfo, b: ScoreboardScoreInfo) => a.score - b.score

export class Leaderboard {
  static db = table<LeaderboardInfo>('leaderboard')

  static tag = 'LEADERBOARD'

  static entityId = CustomEntityTypes.FloatingText

  static formatScore(objectiveId: string, score: number, convertToMetricNumbers = false) {
    if (objectiveId.endsWith('SpeedRun')) return i18n.hhmmss(score)
    if (objectiveId.endsWith('Time')) return i18n.hhmmss(score * 2.5)
    if (objectiveId.endsWith('Date')) return new Date(score * 1000).format()
    if (convertToMetricNumbers) return toMetricNumbers(score)
    else return score
  }

  static styles = {
    gray: { objName: '7', fill1: '7', fill2: 'f', pos: '7', nick: 'f', score: '7' },
    white: { objName: 'f', fill1: 'f', fill2: 'f', pos: 'f', nick: 'f', score: 'f' },
    green: { objName: 'a', fill1: '2', fill2: '3', pos: 'a', nick: 'f', score: 'a' },
  }

  private static untypedStyles = this.styles as Record<string, ValueOf<(typeof Leaderboard)['styles']>>

  static all = new Map<string, Leaderboard>()

  static createLeaderboard({
    objective,
    location,
    dimension = 'overworld',
    style = 'green',
    displayName = objective,
  }: LeaderboardInfo) {
    const entity = world[dimension].spawnEntity<CustomEntityTypes>(Leaderboard.entityId, Vec.floor(location))
    entity.nameTag = 'updating...'
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

  get name(): string {
    const id = this.objective?.id
    if (!id) return 'noname'
    if (isKeyof(id, scoreboardDisplayNames)) return scoreboardDisplayNames[id].to(defaultLang)
    return this.scoreboard.displayName.toString()
  }

  get nameRawText(): RawText | RawMessage {
    const id = this.objective?.id
    if (!id) return { text: 'noname' }
    if (isKeyof(id, scoreboardDisplayNames)) return scoreboardDisplayNames[id].toRawText()
    return { text: this.scoreboard.displayName.toString() }
  }

  updateLeaderboard() {
    if (!this.entity.isValid) return

    // const npc = this.entity.getComponent(EntityComponentTypes.Npc)
    // if (!npc) return

    const scoreboard = this.scoreboard
    const id = this.scoreboard.id
    const name = this.name
    const style = Leaderboard.untypedStyles[this.info.style] ?? Leaderboard.styles.gray
    const filler = `§${style.fill1}-§${style.fill2}-`.repeat(10)

    // const rawtext: RawMessage[] = [{ text: `§l${style.objName}` }, name, { text: `\n§l${filler}§r\n` }]
    let leaderboard = `§l§${style.objName}${name}\n§l${filler}§r\n`
    for (const [i, scoreInfo] of scoreboard
      .getScores()
      .sort(id.endsWith('SpeedRun') ? smallest : biggest)
      .slice(0, 10)
      .entries()) {
      const { pos: t, nick: n, score: s } = style

      const name = Player.nameOrUnknown(scoreInfo.participant.displayName)

      // rawtext.push({ text: `§${t}#${i + 1}§r §${n}${name}§r §${s}` })
      const score = Leaderboard.formatScore(id, scoreInfo.score, true)
      leaderboard += `§${t}#${i + 1}§r §${n}${name}§r §${s}${typeof score === 'number' ? score : score.to(defaultLang)}§r\n`
      // rawtext.push(
      // typeof score === 'string' || typeof score === 'number' ? { text: score.toString() } : score.toRawText(),
      // )
      // rawtext.push({ text: '§r\n' })
    }

    this.entity.nameTag = leaderboard
    // npc.name = ''
    // npc.name = JSON.stringify({ rawtext })
  }
}

system.runInterval(
  () => {
    for (const [id, leaderboard] of Leaderboard.db.entriesImmutable()) {
      if (typeof leaderboard === 'undefined') continue
      const info = Leaderboard.all.get(id)

      if (info?.entity) {
        if (info.entity.isValid) info.updateLeaderboard()
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

const types = ['', i18nShared`к`, i18nShared`млн`, i18nShared`млрд`, i18nShared`трлн`]

/** This will display in text in thousands, millions and etc... For ex: "1400 -> "1.4k", "1000000" -> "1M", etc... */
function toMetricNumbers(value: number) {
  const exp = (Math.log10(value) / 3) | 0

  if (exp === 0) return value.toString()

  const scaled = value / Math.pow(10, exp * 3)
  return i18nShared.nocolor.join`${scaled.toFixed(1)}${exp > 5 ? `E${exp}` : types[exp]}`
}
