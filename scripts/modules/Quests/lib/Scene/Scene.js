import { EasingType, Player, Vector, system } from '@minecraft/server'
import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data.js'
import { EditableLocation, restorePlayerCamera, util } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @typedef {Vector5} SceneDot
 */

export class Scene {
  static db = new DynamicPropertyDB('scene', {
    /**
     * @type {Record<string, SceneDot[]>}
     */
    type: {},
  }).proxy()

  /**
   * @type {Record<string, Scene>}
   */
  static instances = {}

  /**
   * @type {SceneDot[]}
   */
  dots = []

  /**
   * @param {string} name
   */
  constructor(name) {
    Scene.instances[name] = this
    this.name = name
    this.location = new EditableLocation('catscene ' + name).safe
    this.location.onLoad.subscribe(() => {
      this.dots = Scene.db[this.name]
    })
  }

  save() {
    Scene.db[this.name] = this.dots
  }

  intervalTime = 5

  /**
   * @type {Record<string, {
   *   interval: number,
   *   player: Player
   * }>}
   */
  playing = {}

  /**
   * @param {Player} player
   */
  play(player) {
    if (!this.location.valid) {
      const err = this.name + ' катсцена еще не настроена'
      util.error(new Error(err))
      return player.fail(err)
    }

    const curve = this.curve({ step: 0.15 })
    this.playing[player.id] = {
      player,
      interval: system.runInterval(
        () => {
          const location = curve.next().value
          if (this.location.valid && location) {
            player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
              location: Vector.add(this.location, location),
              rotation: { x: location.rx, y: location.ry },
              easeOptions: {
                easeTime: 1,
                easeType: EasingType.Linear,
              },
            })
          } else {
            this.exit(player)
          }
        },
        'scene ' + this.name,
        this.intervalTime
      ),
    }
  }

  *curve({ step = 0.5, vectors = this.dots } = {}) {
    for (let point = 0; point <= vectors.length; point += step) {
      if (!vectors[0]) yield { x: 0, y: 0, z: 0, rx: 0, ry: 0 }
      const i = Math.floor(point)
      const t = point - i
      const v0 = vectors[i - 1] || vectors[0]
      const v1 = vectors[i] || vectors[0]
      const v2 = vectors[i + 1] || v1
      const v3 = vectors[i + 2] || v2

      const x = bezier([v0, v1, v2, v3], 'x', t)
      const y = bezier([v0, v1, v2, v3], 'y', t)
      const z = bezier([v0, v1, v2, v3], 'z', t)

      const rx = bezier([v0, v1, v2, v3], 'rx', t)
      const ry = bezier([v0, v1, v2, v3], 'ry', t)

      yield { x, y, z, rx, ry }
    }
  }

  /**
   * @param {Player} player
   */
  exit(player) {
    if (!this.playing[player.id]) return

    system.clearRun(this.playing[player.id].interval)
    delete this.playing[player.id]

    restorePlayerCamera(player, 2)
  }
}

/**
 * @template {Record<string, number>} T
 * @param {[T, T, T, T]} vectors - Vectors list
 * @param {keyof T} axis - Axis
 * @param {number} t
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
