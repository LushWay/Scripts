import { EasingType, Player, Vector, system } from '@minecraft/server'
import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import importModules from 'modules/importModules.js'
import { EditableLocation, util } from 'xapi.js'
importModules({ array: ['./editMenu.js'], fn: m => import(m) })

/**
 * @typedef {[point: Vector3]} SceneDot
 */

export const CATSCENE_DB = new DynamicPropertyDB('catscene', {
  /**
   * @type {Record<string, SceneDot[]>}
   */
  type: {},
}).proxy()

export class Catscene {
  /**
   * @type {Record<string, Catscene>}
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
    Catscene.instances[name] = this
    this.name = name
    this.location = new EditableLocation('catscene ' + name)
    if (this.location.valid) {
      this.dots = CATSCENE_DB[this.name]
    }
  }

  save() {
    CATSCENE_DB[this.name] = this.dots.map(e => [
      { x: e[0].x, y: e[0].y, z: e[0].z },
    ])
  }

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
      return player.tell(err)
    }
    const curve = generateCurve(
      this.dots.map(e => e[0]),
      this.dots.length * 2,
    )
    let i = 0
    console.debug({ loc: this.location, curv: curve[0] })
    this.playing[player.id] = {
      player,
      intervalId: system.runInterval(
        () => {
          const location = curve[i++]
          if (!location) {
            player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
              location: player.location,
              facingLocation: Vector.add(player.location, Vector.down),
              easeOptions: {
                easeTime: 2,
                easeType: EasingType.Linear,
              },
            })
            return system.runTimeout(
              () => this.exit(player),
              'catscene exit anim',
              2 * 20 + 5,
            )
          }

          player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
            location: Vector.add(this.location, location),
            facingLocation: this.location,
            easeOptions: {
              easeTime: 5 / 20,
              easeType: EasingType.Linear,
            },
          })
        },
        'catscene ' + this.name,
        5,
      ),
    }
  }

  /**
   * @param {Player} player
   */
  exit(player) {
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
function calc(a, vectors, t) {
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
/**
 * @param {Vector3[]} vectors
 * @param {number} numPoints
 */
function generateCurve(vectors, numPoints) {
  const curve = []
  for (let i = 0; i < vectors.length - 1; i++) {
    for (let j = 0; j < numPoints; j++) {
      const t = j / numPoints
      const v0 = vectors[i - 1] || vectors[i]
      const v1 = vectors[i]
      const v2 = vectors[i + 1] || vectors[i]
      const v3 = vectors[i + 2] || vectors[i + 1] || vectors[i]

      const x = calc('x', [v0, v1, v2, v3], t)
      const y = calc('y', [v0, v1, v2, v3], t)
      const z = calc('z', [v0, v1, v2, v3], t)
      curve.push({ x, y, z })
    }
  }
  return curve
}
