import { EasingType, Player, Vector, system } from '@minecraft/server'
import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data.js'
import { EditableLocation, util } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @typedef {[point: Vector3]} SceneDot
 */

export class Scene {
  static db = new DynamicPropertyDB('catscene', {
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
    Scene.db[this.name] = this.dots.map(e => [{ x: e[0].x, y: e[0].y, z: e[0].z }])
  }

  intervalTime = 5

  /**
   * @type {Record<string, {intervalId: number, player: Player,}>}
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
    // TODO Use generator
    const curve = this.generateCurve(void 0, player.location)
    let i = 0
    this.playing[player.id] = {
      player,
      intervalId: system.runInterval(
        () => {
          const location = curve[i++]
          if (!location) {
            player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
              location: player.location,
              facingLocation: Vector.add(
                player.getHeadLocation(),
                Vector.add(player.getViewDirection(), {
                  x: 0,
                  y: 10,
                  z: 0,
                })
              ),
              easeOptions: {
                easeTime: 2,
                easeType: EasingType.Linear,
              },
            })
            return system.runTimeout(() => this.exit(player), 'catscene exit anim', 2 * 20 + 5)
          }

          if (this.location.valid)
            player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
              location: Vector.add(this.location, location),
              facingLocation: this.location,
              easeOptions: {
                easeTime: 1,
                easeType: EasingType.Linear,
              },
            })
        },
        'catscene ' + this.name,
        this.intervalTime
      ),
    }
  }

  /**
   * @param {number} numPoints
   * @param {Vector3 | null} playerLocation
   */
  generateCurve(numPoints = this.dots.length, playerLocation = null) {
    const vectors = this.dots.map(e => e[0])
    if (playerLocation) vectors.push(playerLocation)
    const curve = []
    for (let i = 0; i < vectors.length - 1; i++) {
      for (let j = 0; j < numPoints; j++) {
        const t = j / numPoints
        const v0 = vectors[i - 1] || vectors[i]
        const v1 = vectors[i]
        const v2 = vectors[i + 1] || vectors[i]
        const v3 = vectors[i + 2] || vectors[i + 1] || vectors[i]

        const x = bezier('x', [v0, v1, v2, v3], t)
        const y = bezier('y', [v0, v1, v2, v3], t)
        const z = bezier('z', [v0, v1, v2, v3], t)
        curve.push({ x, y, z })
      }
    }
    return curve
  }

  *curve({ step = 0.5, vectors = this.dots.map(e => e[0]) } = {}) {
    for (let point = 0; point <= vectors.length; point += step) {
      if (!vectors[0]) yield { x: 0, y: 0, z: 0 }
      const i = Math.floor(point)
      const t = point - i
      const v0 = vectors[i - 1] || vectors[0]
      const v1 = vectors[i] || vectors[0]
      const v2 = vectors[i + 1] || v1
      const v3 = vectors[i + 2] || v2

      const x = bezier('x', [v0, v1, v2, v3], t)
      const y = bezier('y', [v0, v1, v2, v3], t)
      const z = bezier('z', [v0, v1, v2, v3], t)
      yield { x, y, z }
    }
  }

  /**
   * @param {Player} player
   */
  exit(player) {
    if (!this.playing[player.id]) return
    player.camera.setCamera(MinecraftCameraPresetsTypes.FirstPerson)
    system.clearRun(this.playing[player.id].intervalId)
    delete this.playing[player.id]
  }
}

/**
 * @param {keyof Vector3} a - Axis
 * @param {[Vector3, Vector3, Vector3, Vector3]} vectors - Vectors list
 * @param {number} t
 */
function bezier(a, vectors, t) {
  const [v0, v1, v2, v3] = vectors
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * v1[a] +
      (-v0[a] + v2[a]) * t +
      (2 * v0[a] - 5 * v1[a] + 4 * v2[a] - v3[a]) * t2 +
      (-v0[a] + 3 * v1[a] - 3 * v2[a] + v3[a]) * t3)
  )
}
