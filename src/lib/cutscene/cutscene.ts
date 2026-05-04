import { EasingType, Player, TicksPerSecond, system } from '@minecraft/server'

import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data'
import { table } from 'lib/database/abstract'
import { noI18n } from 'lib/i18n/text'
import { Compass } from 'lib/rpg/menu'
import { Sidebar } from 'lib/sidebar'
import { hexToRgb } from 'lib/util'
import { restorePlayerCamera } from 'lib/utils/game'
import { WeakPlayerMap } from 'lib/weak-player-storage'

export namespace Cutscene {
  export interface Options {
    instantEnter?: boolean
    restoreCameraTime?: number
  }

  /** Controller used to abort playing cutscene animation */
  export interface AbortController {
    cancel: boolean
  }

  /**
   * Represents single cutscene point. It has Vector3 properties and rotation properties (rx for rotation x, and ry for
   * rotation y)
   */
  export type Point = Vector5

  /** Single cutscene section that contains points and information about easing/animation time */
  export interface Section {
    points: Point[]
    step: number
    easeType?: EasingType
    easeTime?: number
  }

  export type Sections = (undefined | Section)[]
}

export class Cutscene {
  /** Database containing Cutscene trail points */
  static db = table<Cutscene.Sections>('cutscene', () => [])

  /** List of all cutscenes */
  static all = new Map<string, Cutscene>()

  static getCurrent(player: Player) {
    for (const cutscene of this.all.values()) {
      if (cutscene.current.get(player.id)) return cutscene
    }
  }

  static getVector5(player: Player): Vector5 {
    const { x: rx, y: ry } = player.getRotation()
    const { x, y, z } = player.getHeadLocation()
    return { x, y, z, rx: Math.floor(rx), ry: Math.floor(ry) }
  }

  /** List of cutscene sections */
  sections: Cutscene.Sections = []

  private intervalTime = 5

  /** List of players that currently see cutscene play */
  private current = new WeakPlayerMap<{
    player: Player
    controller: Cutscene.AbortController
  }>({
    onLeave: playerId => this.exit(playerId),
  })

  /** Creates a new Cutscene. */
  constructor(
    public id: string,
    /** Internal use only */
    public displayName: Text,
    readonly options: Cutscene.Options = {},
  ) {
    Cutscene.all.set(id, this)

    Cutscene.db.onLoad(() => {
      this.sections = Cutscene.db.get(this.id).slice()
      this.sections = this.sections.filter(e => e?.points.length)
      this.save()
    })
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

  play(player: Player, sections = this.sections) {
    if (!sections[0]?.points[0]) {
      console.error(`${this.id}: cutscene is not ready.`, sections)
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

        const firstPoint = pointNum === 0
        const firstSection = sectionNum === 0
        const sectionSwitch = this.options.instantEnter ? firstPoint : firstPoint && !firstSection
        if (!sectionSwitch) {
          player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
            location: point,
            rotation: { x: point.rx, y: point.ry },
            easeOptions: Object.assign(this.defaultSection, section),
          })
        } else {
          // Section switch
          this.darkScreen(player)

          await system.sleep(10)

          if (!(player.isValid as boolean)) return

          player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
            location: point,
            rotation: { x: point.rx, y: point.ry },
          })
        }
      },
      { controller, sections, exit: () => this.exit(player) },
    )

    this.current.set(player.id, { player, controller })

    return promise
  }

  private switchColor = hexToRgb('#102010')

  private darkScreen(player: Player) {
    player.camera.fade({
      fadeTime: { fadeInTime: 0.5, holdTime: 0.5, fadeOutTime: 1 },
      fadeColor: this.switchColor,
    })
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
    callback: (
      point: Cutscene.Point,
      pointIndex: number,
      section: Cutscene.Section,
      sectionIndex: number,
    ) => void | Promise<void>,
    {
      controller,
      sections,
      exit,
      intervalTime = this.intervalTime,
    }: {
      controller: Cutscene.AbortController
      sections: Cutscene.Sections
      exit?: VoidFunction
      intervalTime?: number
    },
  ) {
    try {
      for (const [sectionIndex, section] of sections.entries()) {
        if (!section) return

        for (const { index: pointIndex, ...point } of this.pointIterator(section)) {
          if (controller.cancel) return

          await callback(point, pointIndex, section, sectionIndex)
          await system.sleep(intervalTime)
        }
      }
    } finally {
      exit?.()
    }
  }

  /** Uses bezier curves to interpolate points along a section. */
  private *pointIterator({ step, points }: Cutscene.Section) {
    const emptyPoint: Cutscene.Point = { rx: 0, ry: 0, x: 0, y: 0, z: 0 }

    // Fixes issues with camera doing 360 spin
    // this happens because angles like -10 and 350 are pretty close
    // but bezier does not take that into consideration
    const unwrapped = points.map(p => ({ ...p }))
    for (let i = 1; i < unwrapped.length; i++) {
      const prev = unwrapped[i - 1] ?? emptyPoint
      const curr = unwrapped[i] ?? emptyPoint
      const drx = this.wrapDelta(curr.rx - prev.rx)
      const dry = this.wrapDelta(curr.ry - prev.ry)
      curr.rx = prev.rx + drx
      curr.ry = prev.ry + dry
    }

    let index = 0
    for (let point = 0; point <= unwrapped.length; point += step) {
      if (!unwrapped[0]) yield { ...emptyPoint, index }
      const i = Math.floor(point)
      const t = point - i
      const v0 = unwrapped[i - 1] ?? unwrapped[0] ?? emptyPoint
      const v1 = unwrapped[i] ?? unwrapped[0] ?? emptyPoint
      const v2 = unwrapped[i + 1] ?? v1
      const v3 = unwrapped[i + 2] ?? v2

      const x = this.bezier([v0, v1, v2, v3], 'x', t)
      const y = this.bezier([v0, v1, v2, v3], 'y', t)
      const z = this.bezier([v0, v1, v2, v3], 'z', t)

      const rx = this.bezier([v0, v1, v2, v3], 'rx', t)
      const ry = this.bezier([v0, v1, v2, v3], 'ry', t)

      yield { x, y, z, rx, ry, index }
      index++
    }
  }

  // function to wrap a delta into [-180, 180]
  private wrapDelta(delta: number) {
    if (delta > 180) return delta - 360 * Math.ceil((delta - 180) / 360)
    if (delta < -180) return delta + 360 * Math.ceil((-delta - 180) / 360)
    return delta
  }

  /**
   * Calculates the value of a point on a cubic Bezier curve.
   *
   * @template T - Vector type
   * @param vectors - Array of four control points that define a cubic Bezier curve. Each control point is a Record that
   *   have the provided axis
   * @param axis - Axis along which the Bezier curve is being calculated. It specifies whether the calculation is for
   *   the x-axis, y-axis, or z-axis of the provided vectors.
   * @param t - Interpolation value between two points on a Bezier curve. It is typically a value between 0 and 1, where
   *   0 corresponds to the starting point of the curve and 1 corresponds to the ending point of the curve.
   */
  private bezier<T extends Record<string, number>>(vectors: [T, T, T, T], axis: keyof T, t: number) {
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
      const restoreCameraTime = this.options.restoreCameraTime ?? 1
      if (restoreCameraTime) {
        restorePlayerCamera(player, restoreCameraTime)
      } else {
        this.darkScreen(player)

        // When configuring cutscene and using play button
        // cutscene that has second cutscene after it and does not
        // restore camera will make player stuck in the state
        // without controls and stuck camera. So we run a timeout
        // that checks if other cutscene is being run and if not resets
        // the camera and controls
        system.runTimeout(
          () => {
            if (!Cutscene.getCurrent(player)) restorePlayerCamera(player, 0)
          },
          'restoreCutsceneHud',
          1 * TicksPerSecond,
        )
      }
    }

    return true
  }

  withNewPoint(
    source: Player,
    {
      sections = this.sections.slice(),
      sectionIndex = sections.length - 1,
      warn = false,
    }: { sections?: Cutscene.Sections; sectionIndex?: number; warn?: boolean } = {},
  ) {
    const section = sections[sectionIndex]

    if (section) {
      section.points.push(Cutscene.getVector5(source))
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

  withNewSection(sections: Cutscene.Sections = this.sections.slice(), section: Partial<Cutscene.Section>) {
    sections.push(Object.assign(section, this.defaultSection))

    return sections
  }

  /** Saves cutscene sections to the database */
  save() {
    Cutscene.db.set(this.id, this.sections)
  }
}
