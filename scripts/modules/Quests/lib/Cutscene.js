import { EasingType, Player, Vector, system } from '@minecraft/server'
import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data.js'
import { restorePlayerCamera } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

export class Cutscene {
  /**
   * Represents single cutscene point. It has Vector3 properties and rotation properties (rx for rotation x, and ry for
   * rotation y)
   *
   * @typedef {Vector5} Point
   */

  /**
   * Single cutscene section that contains points and information about easing/animation time
   *
   * @typedef {{
   *   points: Point[]
   *   step: number
   *   easeType?: EasingType
   *   easeTime?: number
   * }} Section
   */

  /**
   * Section list
   *
   * @typedef {(undefined | Section)[]} Sections
   */

  /**
   * Controller used to abort playing cutscene animation
   *
   * @typedef {{ cancel: boolean }} AbortController
   */

  /** Database containing Cutscene trail points */
  static db = new DynamicPropertyDB('cutscene', {
    /** @type {Record<string, Sections>} */
    type: {},
    defaultValue: () => [],
  }).proxy()

  /**
   * List of all cutscenes
   *
   * @type {Record<string, Cutscene>}
   */
  static list = {}

  /** @param {Player} player */
  static getCurrent(player) {
    return Object.values(this.list).find(e => e.current[player.id])
  }

  /**
   * List of cutscene sections
   *
   * @type {Sections}
   */
  sections = []

  /** @private */
  intervalTime = 5

  /** @private */
  restoreCameraTime = 2

  /**
   * List of players that currently see cutscene play
   *
   * @private
   * @type {Record<
   *   string,
   *   {
   *     player: Player
   *     controller: AbortController
   *   }
   * >}
   */
  current = {}

  /**
   * Creates a new Cutscene.
   *
   * @param {string} id
   * @param {string} displayName
   */
  constructor(id, displayName) {
    Cutscene.list[id] = this

    this.id = id
    this.displayName = displayName
    this.sections = Cutscene.db[this.id].slice()
  }

  /**
   * @private
   * @type {Section}
   */
  get defaultSection() {
    return {
      points: [],
      step: 0.15,
      easeTime: 1,
      easeType: EasingType.Linear,
    }
  }

  /**
   * @private
   * @type {Partial<Section>}
   */
  get switchSection() {
    return {
      easeTime: 0.05,
      easeType: EasingType.Linear,
    }
  }

  /**
   * Plays the Cutscene for the provided player
   *
   * @param {Player} player - Player to play cutscene for
   */
  play(player) {
    if (!this.sections[0]?.points[0]) {
      console.error(`${this.id}: cutscene is not ready.`)
      player.fail(`${this.displayName}: cцена еще не настроена`)
      return
    }

    const controller = { cancel: false }
    this.forEachPoint(
      (point, pointIndex, section) => {
        player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
          location: point,
          rotation: { x: point.rx, y: point.ry },
          easeOptions: Object.assign(this.defaultSection, pointIndex === 0 ? this.switchSection : section),
        })
      },
      { controller, exit: () => this.exit(player) },
    )

    this.current[player.id] = {
      player,
      controller,
    }
  }

  /**
   * Asynchronuosly runs callback for each point in the cutscene. Callback has access to the current point section
   *
   * @param {(point: Point, pointIndex: number, section: Section, sectionIndex: number) => void} callback - Function
   *   that runs on every point
   * @param {object} options
   * @param {AbortController} options.controller - Controller used to abort operation
   * @param {Sections} [options.sections] - Section list
   * @param {VoidFunction} [options.exit] - Cleanup function used when there is no points or error happened
   * @param {number} [options.intervalTime]
   */
  async forEachPoint(callback, { controller, sections = this.sections, exit, intervalTime = this.intervalTime }) {
    try {
      for (const [sectionIndex, section] of sections.entries()) {
        if (!section) throw 0

        for (const { index: pointIndex, ...point } of this.pointIterator(section)) {
          if (controller.cancel) throw 0

          callback(point, pointIndex, section, sectionIndex)
          await system.sleep(intervalTime)
        }
      }
    } catch (error) {
      // 0 means end
      if (error !== 0) console.error(error)
    } finally {
      exit?.()
    }
  }

  /**
   * Uses bezier curves to interpolate points along a section.
   *
   * @private
   * @param {Section} section
   */
  *pointIterator({ step = 0.5, points }) {
    let index = 0
    for (let point = 0; point <= points.length; point += step) {
      index++

      if (!points[0]) yield { x: 0, y: 0, z: 0, rx: 0, ry: 0, index }
      const i = Math.floor(point)
      const t = point - i
      const v0 = points[i - 1] || points[0]
      const v1 = points[i] || points[0]
      const v2 = points[i + 1] || v1
      const v3 = points[i + 2] || v2

      const x = bezier([v0, v1, v2, v3], 'x', t)
      const y = bezier([v0, v1, v2, v3], 'y', t)
      const z = bezier([v0, v1, v2, v3], 'z', t)

      const rx = bezier([v0, v1, v2, v3], 'rx', t)
      const ry = bezier([v0, v1, v2, v3], 'ry', t)

      yield { x, y, z, rx, ry, index }
    }
  }

  /**
   * Stops a player's cutscene animation, removes them from the list of active players, and restores their camera.
   *
   * @param {Player} player - The player to stop cutscene on
   */
  exit(player) {
    if (!this.current[player.id]) return false

    // Cancel animation
    this.current[player.id].controller.cancel = true

    // Cleanup and restore to the previous state
    delete this.current[player.id]
    restorePlayerCamera(player, this.restoreCameraTime)

    return true
  }

  /**
   * @param {Player} source
   * @param {Object} [options]
   * @param {Sections} [options.sections] Default is `this.sections.slice()`
   * @param {number} [options.sectionIndex] Default is `sections.length - 1`
   * @param {boolean} [options.warn]
   */
  withNewPoint(source, { sections = this.sections.slice(), sectionIndex = sections.length - 1, warn = false } = {}) {
    const section = sections[sectionIndex]

    if (section) {
      section.points.push(getVector5(source))
    } else {
      warn && source.warn(`Не удалось найти секцию. Позиция секции: ${sectionIndex}, всего секций: ${sections.length}`)

      return false
    }

    return sections
  }

  /**
   * @param {Sections} sections
   * @param {Partial<Section>} section
   */
  withNewSection(sections = this.sections.slice(), section) {
    sections.push(Object.assign(section, this.defaultSection))

    return sections
  }

  /** Saves cutscene sections to the database */
  save() {
    Cutscene.db[this.id] = this.sections
  }
}

/**
 * Calculates the value of a point on a cubic Bezier curve.
 *
 * @template {Record<string, number>} T - Vector type
 * @param {[T, T, T, T]} vectors - Array of four control points that define a cubic Bezier curve. Each control point is
 *   a Record that have the provided axis
 * @param {keyof T} axis - Axis along which the Bezier curve is being calculated. It specifies whether the calculation
 *   is for the x-axis, y-axis, or z-axis of the provided vectors.
 * @param {number} t - Interpolation value between two points on a Bezier curve. It is typically a value between 0 and
 *   1, where 0 corresponds to the starting point of the curve and 1 corresponds to the ending point of the curve.
 */
function bezier(vectors, axis, t) {
  const [v0, v1, v2, v3] = vectors
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * v1[axis] +
      (-v0[axis] + v2[axis]) * t +
      (2 * v0[axis] - 5 * v1[axis] + 4 * v2[axis] - v3[axis]) * t2 +
      (-v0[axis] + 3 * v1[axis] - 3 * v2[axis] + v3[axis]) * t3)
  )
}

/**
 * @param {Player} player
 * @returns {Vector5}
 */

function getVector5(player) {
  const { x: rx, y: ry } = player.getRotation()
  const { x, y, z } = Vector.floor(player.getHeadLocation())
  return { x, y, z, rx: Math.floor(rx), ry: Math.floor(ry) }
}
