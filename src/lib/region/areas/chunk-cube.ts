import { Vector3 } from '@minecraft/server'
import { AbstractPoint, toPoint } from 'lib/game-utils'
import { Vector } from 'lib/vector'
import { Area } from './area'

class ChunkCube extends Area<{ from: VectorXZ; to: VectorXZ }> {
  type = 'c'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    const [from, to] = this.edges

    return Vector.between(
      distance === 0 ? from : Vector.add(Vector.min(from, to), { x: -distance, y: 0, z: -distance }),
      distance === 0 ? to : Vector.add(Vector.max(from, to), { x: distance, y: 0, z: distance }),
      { x: vector.x, y: 0, z: vector.z },
    )
  }

  get center() {
    return {
      x: Math.abs(this.database.from.x - this.database.to.x) / 2,
      y: this.dimension.heightRange.max - this.dimension.heightRange.min / 2,
      z: Math.abs(this.database.from.z - this.database.to.z) / 2,
    }
  }

  getFormDescription(): Record<string, unknown> {
      return {
        From: `${this.database.from.x} ${this.database.from.z}`,
        To: `${this.database.to.x} ${this.database.to.z}`
      }
  }

  get edges(): [Vector3, Vector3] {
    const { max, min } = this.dimension.heightRange
    const { from, to } = this.database
    return [
      { x: from.x, y: max, z: from.z },
      { x: to.x, y: min, z: to.z },
    ]
  }
}

export const ChunkCubeArea = ChunkCube.asSaveableArea()
