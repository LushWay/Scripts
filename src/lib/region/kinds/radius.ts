import { Dimension, system, world } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { RLDB, RadiusRegionSave, registerRegionKind } from '../database'
import { Region, RegionCreationOptions } from './region'

export interface RadiusRegionOptions extends RegionCreationOptions {
  /** The position of the region center */
  center: Vector3
  /** The radius of the region */
  radius: number
}

export class RadiusRegion<LDB extends RLDB = any> extends Region<LDB> implements RadiusRegionOptions {
  static readonly type: string = 'r'

  static readonly kind: string = 'radius'

  center: Vector3

  radius: number

  constructor(options: RadiusRegionOptions, key: string) {
    super(options, key)
    this.center = options.center
    this.radius = options.radius
  }

  isVectorInRegion(vector: Vector3, dimensionId: Dimensions) {
    return super.isVectorInRegion(vector, dimensionId) && Vector.distance(this.center, vector) < this.radius
  }

  protected toJSON() {
    return {
      ...super.toJSON(),
      center: this.center,
      radius: this.radius,
    } as RadiusRegionSave
  }

  protected get edges() {
    return Vector.around(this.center, this.radius - 1)
  }

  forEachVector(callback: (vector: Vector3, isIn: boolean, dimension: Dimension) => void) {
    const edges = this.edges
    const dimension = world[this.dimensionId]
    const isIn = (v: Vector3) => this.isVectorInRegion(v, this.dimensionId)

    return new Promise<void>((resolve, reject) => {
      system.runJob(
        (function* loadStructureJob() {
          try {
            for (const vector of Vector.foreach(...edges)) {
              callback(vector, isIn(vector), dimension)
              yield
            }
            resolve()
          } catch (e: unknown) {
            reject(e as Error)
          }
        })(),
      )
    })
  }
}

registerRegionKind(RadiusRegion)
