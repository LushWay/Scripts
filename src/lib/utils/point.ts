import { Block, Entity } from '@minecraft/server'
import { Vector } from 'lib/vector'

/** Represents location in the specific dimension */

export interface VectorInDimension {
  /** Location of the place */
  vector: Vector3
  /** Dimension of the location */
  dimensionType: DimensionType
}

export type AbstractPoint = VectorInDimension | Entity | Block

export function toPoint(abstractPoint: AbstractPoint): VectorInDimension {
  if (abstractPoint instanceof Entity || abstractPoint instanceof Block) {
    return { vector: abstractPoint.location, dimensionType: abstractPoint.dimension.type }
  } else return abstractPoint
}

export function toFlooredPoint(abstractPoint: AbstractPoint): VectorInDimension {
  const { vector, dimensionType } = toPoint(abstractPoint)
  return { vector: Vector.floor(vector), dimensionType }
}

export function createPoint(
  x: number,
  y: number,
  z: number,
  dimensionType: DimensionType = 'overworld',
): VectorInDimension {
  return { vector: { x, y, z }, dimensionType }
}
