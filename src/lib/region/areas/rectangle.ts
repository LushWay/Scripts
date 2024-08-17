import { Vector3 } from '@minecraft/server'
import { Vector } from 'lib'
import { Area } from './area'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Rect = {
  from: { x: number; z: number; y: number }
  to: { x: number; z: number; y: number }
}

class Rectangle extends Area<Rect> {
  type = 'rect'

  isVectorIn(vector: Vector3, dimension: Dimensions) {
    return super.isVectorIn(vector, dimension) && Vector.between(...this.edges, vector)
  }

  get center() {
    return {
      x: Math.abs(this.database.from.x - this.database.to.x) / 2,
      y: Math.abs(this.database.from.y - this.database.to.y) / 2,
      z: Math.abs(this.database.from.z - this.database.to.z) / 2,
    }
  }

  get edges(): [Vector3, Vector3] {
    return [this.database.from, this.database.to]
  }

  isNear(vector: Vector3, distance: number): boolean {
    const [from, to] = this.edges

    return Vector.between(
      Vector.add(Vector.min(from, to), { x: -distance, y: -distance, z: -distance }),
      Vector.add(Vector.max(from, to), { x: distance, y: distance, z: distance }),
      { x: vector.x, y: vector.y, z: vector.z },
    )
  }
}

export const RectangleArea = Rectangle.SaveableArea()
