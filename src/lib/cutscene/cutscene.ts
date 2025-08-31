import { EasingType, Player, TicksPerSecond, system } from '@minecraft/server'
import { Vec } from 'lib/vector'

import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data'
import { table } from 'lib/database/abstract'
import { noI18n } from 'lib/i18n/text'
import { Compass } from 'lib/rpg/menu'
import { Sidebar } from 'lib/sidebar'
import { restorePlayerCamera } from 'lib/utils/game'
import { WeakPlayerMap } from 'lib/weak-player-storage'

/**
 * Represents single cutscene point. It has Vector3 properties and rotation properties (rx for rotation x, and ry for
 * rotation y)
 */
type Point = Vector5

/** Single cutscene section that contains points and information about easing/animation time */
interface Section {
  points: Point[]
  step: number
  easeType?: EasingType
  easeTime?: number
}

/** Section list */
type Sections = (undefined | Section)[]

/** Controller used to abort playing cutscene animation */
interface AbortController {
  cancel: boolean
}

export class Cutscene {
  /** Database containing Cutscene trail points */
  static db = table<Sections>('cutscene', () => [])

  /** List of all cutscenes */
  static all = new Map<string, Cutscene>()

  static getCurrent(player: Player) {
    for (const cutscene of this.all.values()) {
      if (cutscene.current.get(player.id)) return cutscene
    }
  }

  /** List of cutscene sections */
  sections: Sections = []

  private intervalTime = 5

  private restoreCameraTime = 2

  /** List of players that currently see cutscene play */
  private current = new WeakPlayerMap<{ player: Player; controller: AbortController }>({
    onLeave: playerId => this.exit(playerId),
  })

  /** Creates a new Cutscene. */

  constructor(
    public id: string,
    public displayName: Text,
  ) {
    Cutscene.all.set(id, this)

    this.sections = Cutscene.db.get(this.id).slice()
  }

  private get defaultSection() {
    return { points: [], step: 0.15, easeTime: 1, easeType: EasingType.Linear }
  }

  get start() {
    return this.sections[0]?.points[0]
  }

  /**
   * Plays the Cutscene for the provided player
   *
   * @param player - Player to play cutscene for
   */

  play(player: Player) {
    if (!this.sections[0]?.points[0]) {
      console.error(`${this.id}: cutscene is not ready.`)
      player.fail(noI18n`${this.displayName}: cutscene is not ready.`)
      return
    }

    player.onScreenDisplay.hideAllExcept([])
    Compass.forceHide.add(player)
    Sidebar.forceHide.add(player)

    const controller = { cancel: false }
    const promise = this.forEachPoint(
      async (point, pointNum, section, sectionNum) => {
        if (!player.isValid) {
          controller.cancel = true
          return
        }

        const sectionSwitch = pointNum === 0 && sectionNum !== 0
        if (!sectionSwitch) {
          player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
            location: point,
            rotation: { x: point.rx, y: point.ry },
            easeOptions: Object.assign(this.defaultSection, section),
          })
        } else {
          const red = 10 / 256
          const green = 20 / 256
          const blue = 10 / 256
          // #102010

          player.camera.fade({
            fadeTime: { fadeInTime: 0.5, holdTime: 0.5, fadeOutTime: 1 },
            fadeColor: { red, green, blue },
          })

          await system.sleep(10)

          if (!(player.isValid as boolean)) return

          // There is no way to set a camera without easing using pure script
          player.runCommand(
            `camera @s set ${MinecraftCameraPresetsTypes.Free} pos ${Vec.string(point)} rot ${point.rx} ${point.ry}`,
          )
        }
      },
      { controller, exit: () => this.exit(player) },
    )

    this.current.set(player.id, { player, controller })

    return promise
  }

  /**
   * Asynchronuosly runs callback for each point in the cutscene. Callback has access to the current point section
   *
   * @param callback - Function that runs on every point
   * @param options
   * @param options.controller - Controller used to abort operation
   * @param options.sections - Section list
   * @param options.exit - Cleanup function used when there is no points or error happened
   * @param options.intervalTime
   */

  async forEachPoint(
    callback: (point: Point, pointIndex: number, section: Section, sectionIndex: number) => void | Promise<void>,
    {
      controller,
      sections = this.sections,
      exit,
      intervalTime = this.intervalTime,
    }: { controller: AbortController; sections?: Sections; exit?: VoidFunction; intervalTime?: number },
  ) {
    const end = new Error('End.')
    try {
      for (const [sectionIndex, section] of sections.entries()) {
        if (!section) throw end

        for (const { index: pointIndex, ...point } of this.pointIterator(section)) {
          if (controller.cancel) throw end

          await callback(point, pointIndex, section, sectionIndex)
          await system.sleep(intervalTime)
        }
      }
    } catch (error) {
      if (error !== end) console.error(error)
    } finally {
      exit?.()
    }
  }

  /** Uses bezier curves to interpolate points along a section. */
  private *pointIterator({ step = 0.5, points }: Section) {
    const emptyPoint: Point = { rx: 0, ry: 0, x: 0, y: 0, z: 0 }
    let index = 0
    for (let point = 0; point <= points.length; point += step) {
      if (!points[0]) yield { x: 0, y: 0, z: 0, rx: 0, ry: 0, index }
      const i = Math.floor(point)
      const t = point - i
      const v0 = points[i - 1] ?? points[0] ?? emptyPoint
      const v1 = points[i] ?? points[0] ?? emptyPoint
      const v2 = points[i + 1] ?? v1
      const v3 = points[i + 2] ?? v2

      const x = bezier([v0, v1, v2, v3], 'x', t)
      const y = bezier([v0, v1, v2, v3], 'y', t)
      const z = bezier([v0, v1, v2, v3], 'z', t)

      const rx = bezier([v0, v1, v2, v3], 'rx', t)
      const ry = bezier([v0, v1, v2, v3], 'ry', t)

      yield { x, y, z, rx, ry, index }
      index++
    }
  }

  /**
   * Stops a player's cutscene animation, removes them from the list of active players, and restores their camera.
   *
   * @param player - The player to stop cutscene on
   */
  exit(player: Player | string) {
    const playerId = player instanceof Player ? player.id : player
    const state = this.current.get(playerId)
    if (!state) return false

    // Cancel animation
    state.controller.cancel = true

    // Cleanup and restore to the previous state
    this.current.delete(playerId)
    if (player instanceof Player) {
      restorePlayerCamera(player, this.restoreCameraTime)
      system.runTimeout(
        () => {
          if (player.isValid) player.onScreenDisplay.resetHudElementsVisibility()
          Compass.forceHide.delete(player)
          Sidebar.forceHide.delete(player)
        },
        'restoreCutsceneHud',
        this.restoreCameraTime * TicksPerSecond,
      )
    }

    return true
  }

  withNewPoint(
    source: Player,
    {
      sections = this.sections.slice(),
      sectionIndex = sections.length - 1,
      warn = false,
    }: { sections?: Sections; sectionIndex?: number; warn?: boolean } = {},
  ) {
    const section = sections[sectionIndex]

    if (section) {
      section.points.push(getVector5(source))
    } else {
      if (warn) {
        source.warn(
          noI18n`Unable to find section. Section index: ${sectionIndex}, total amount of sections: ${sections.length}`,
        )
      }

      return false
    }

    return sections
  }

  withNewSection(sections: Sections = this.sections.slice(), section: Partial<Section>) {
    sections.push(Object.assign(section, this.defaultSection))

    return sections
  }

  /** Saves cutscene sections to the database */
  save() {
    Cutscene.db.set(this.id, this.sections)
  }
}

/**
 * Calculates the value of a point on a cubic Bezier curve.
 *
 * @template T - Vector type
 * @param vectors - Array of four control points that define a cubic Bezier curve. Each control point is a Record that
 *   have the provided axis
 * @param axis - Axis along which the Bezier curve is being calculated. It specifies whether the calculation is for the
 *   x-axis, y-axis, or z-axis of the provided vectors.
 * @param t - Interpolation value between two points on a Bezier curve. It is typically a value between 0 and 1, where 0
 *   corresponds to the starting point of the curve and 1 corresponds to the ending point of the curve.
 */
function bezier<T extends Record<string, number>>(vectors: [T, T, T, T], axis: keyof T, t: number) {
  const [v0, v1, v2, v3] = vectors
  const t2 = t * t
  const t3 = t2 * t
  const vv1 = v1[axis] ?? 0
  const vv0 = v0[axis] ?? 0
  const vv2 = v2[axis] ?? 0
  const vv3 = v3[axis] ?? 0
  return (
    0.5 *
    (2 * vv1 + (-vv0 + vv2) * t + (2 * vv0 - 5 * vv1 + 4 * vv2 - vv3) * t2 + (-vv0 + 3 * vv1 - 3 * vv2 + vv3) * t3)
  )
}

function getVector5(player: Player): Vector5 {
  const { x: rx, y: ry } = player.getRotation()
  const { x, y, z } = Vec.floor(player.getHeadLocation())
  return { x, y, z, rx: Math.floor(rx), ry: Math.floor(ry) }
}
