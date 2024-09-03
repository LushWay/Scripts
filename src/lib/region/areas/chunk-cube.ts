import { Vector3 } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { Area } from './area'

class ChunkCube extends Area<{ from: VectorXZ; to: VectorXZ }> {
  type = 'c'

  isVectorIn(vector: Vector3, dimension: Dimensions) {
    return super.isVectorIn(vector, dimension) && Vector.between(...this.edges, vector)
  }

  get center() {
    return {
      x: Math.abs(this.database.from.x - this.database.to.x) / 2,
      y: this.dimension.heightRange.max - this.dimension.heightRange.min / 2,
      z: Math.abs(this.database.from.z - this.database.to.z) / 2,
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

  isNear(vector: Vector3, distance: number): boolean {
    const [from, to] = this.edges

    return Vector.between(
      Vector.add(Vector.min(from, to), { x: -distance, y: 0, z: -distance }),
      Vector.add(Vector.max(from, to), { x: distance, y: 0, z: distance }),
      { x: vector.x, y: 0, z: vector.z },
    )
  }
}

export const ChunkCubeArea = ChunkCube.SaveableArea()
