import { world } from '@minecraft/server'
import { Region, RegionCreationOptions } from './region'
import { Vector } from 'lib/vector'
import { CubeRegionSave, registerRegionKind } from '../database'

interface CubeRegionOptions extends RegionCreationOptions {
  /** The position of the first block of the region. */
  from: VectorXZ
  /** The position of the region's end. */
  to: VectorXZ
}

export class CubeRegion extends Region implements CubeRegionOptions {
  static type = 'c'

  static kind = 'cube'

  from: VectorXZ

  to: VectorXZ

  constructor(options: CubeRegionOptions, key: string) {
    super(options, key)
    this.from = options.from
    this.to = options.to
  }

  get edges() {
    return {
      from: { x: this.from.x, y: world[this.dimensionId].heightRange.max, z: this.from.z },
      to: { x: this.to.x, y: world[this.dimensionId].heightRange.min, z: this.to.z },
    }
  }

  isVectorInRegion(vector: Vector3, dimension: Dimensions) {
    if (!super.isVectorInRegion(vector, dimension)) return false

    const { from, to } = this.edges
    return Vector.between(from, to, vector)
  }

  protected toJSON() {
    return {
      ...super.toJSON(),
      from: this.from,
      to: this.to,
    } as CubeRegionSave
  }
}

registerRegionKind(CubeRegion)
