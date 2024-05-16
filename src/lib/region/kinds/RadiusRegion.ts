import { Vector } from 'lib/vector'
import { Region, RegionCreationOptions } from 'lib/region/Region'
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

  /** @inheritdoc */
  static create<T extends typeof Region>(this: T, options: ConstructorParameters<T>[0], key?: string): InstanceType<T> {
    const region = super.create(options, key ?? this.generateRegionKey())

    // Set radius region kind
    if (region instanceof RadiusRegion) {
      region.kind = (this as unknown as RadiusRegion).kind
    }

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

  /** @inheritdoc */
  isVectorInRegion(vector: Vector3, dimensionId: Dimensions) {
    if (!super.isVectorInRegion(vector, dimensionId)) return false

    return Vector.distance(this.center, vector) < this.radius
  }

  /** @inheritdoc */
  protected toJSON() {
    return {
      ...super.toJSON(),
      t: 'r' as const,
      st: this.kind,
      center: this.center,
      radius: this.radius,
    }
  }

  /** @inheritdoc */
  save() {
    if (!this.saveable) return false
    RegionDatabase[this.key] = this.toJSON()
  }
}
