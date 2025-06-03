import { Block, Entity } from '@minecraft/server'
import { Vec } from 'lib/vector'

/** Represents location in the specific dimension */

export interface VectorInDimension {
  /** Location of the place */
  location: Vector3
  /** Dimension of the location */
  dimensionType: DimensionType
}

export type AbstractPoint = VectorInDimension | Entity | Block

export function toPoint(abstractPoint: AbstractPoint): VectorInDimension {
  if (abstractPoint instanceof Entity || abstractPoint instanceof Block) {
    return { location: abstractPoint.location, dimensionType: abstractPoint.dimension.type }
  } else return abstractPoint
}

export function toFlooredPoint(abstractPoint: AbstractPoint): VectorInDimension {
  const { location, dimensionType } = toPoint(abstractPoint)
  return { location: Vec.floor(location), dimensionType }
}

export function createPoint(
  x: number,
  y: number,
  z: number,
  dimensionType: DimensionType = 'overworld',
): VectorInDimension {
  return { location: { x, y, z }, dimensionType }
}

export function createPointVec(location: Vector3, dimensionType: DimensionType = 'overworld'): VectorInDimension {
  return { location, dimensionType }
}
