import { Dimension, system, world } from '@minecraft/server'
import { Region, RegionCreationOptions } from 'lib/region/Region'
import { Vector } from 'lib/vector'
import { RegionDatabase } from '../database'

export interface RadiusRegionOptions extends RegionCreationOptions {
  /** The position of the region center */
  center: Vector3
  /** The radius of the region */
  radius: number
}

export class RadiusRegion extends Region implements RadiusRegionOptions {
  /** Used to restore region from the database */
  static readonly kind: string = 'radius'

  static create<T extends typeof Region>(this: T, options: ConstructorParameters<T>[0], key?: string): InstanceType<T> {
    const region = super.create(options, key ?? this.generateRegionKey())

    // Set radius region kind
    ;(region as unknown as RadiusRegion).kind = (this as unknown as RadiusRegion).kind

    if (!key) region.save()

    return region as unknown as InstanceType<T>
  }

  /**
   * RadiusRegion kind. Do not specify it directly in the subclassed regions, because it is setted from the static
   * property by {@link RadiusRegion.create} method
   */
  private kind = RadiusRegion.kind

  center: Vector3

  radius: number

  constructor(options: RadiusRegionOptions, key: string) {
    super(options, key)
    this.center = options.center
    this.radius = options.radius
  }

  isVectorInRegion(vector: Vector3, dimensionId: Dimensions) {
    if (!super.isVectorInRegion(vector, dimensionId)) return false

    return Vector.distance(this.center, vector) < this.radius
  }

  protected toJSON() {
    return {
      ...super.toJSON(),
      t: 'r' as const,
      st: this.kind,
      center: this.center,
      radius: this.radius,
    }
  }

  save() {
    if (!this.saveable) return false
    RegionDatabase[this.key] = this.toJSON()
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
