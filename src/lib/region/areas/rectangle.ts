import { Vector3 } from '@minecraft/server'
import { AbstractPoint, toPoint } from 'lib/game-utils'
import { Vector } from 'lib/vector'
import { Area } from './area'

class Rectangle extends Area<{
  from: { x: number; z: number; y: number }
  to: { x: number; z: number; y: number }
}> {
  type = 'rect'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    const [from, to] = this.edges

    return Vector.between(
      distance === 0 ? from : Vector.add(Vector.min(from, to), { x: -distance, y: -distance, z: -distance }),
      distance === 0 ? to : Vector.add(Vector.max(from, to), { x: distance, y: distance, z: distance }),
      vector,
    )
  }

  get center() {
    return {
      x: this.database.from.x + Math.abs(this.database.from.x - this.database.to.x) / 2,
      y: this.database.from.y + Math.abs(this.database.from.y - this.database.to.y) / 2,
      z: this.database.from.z + Math.abs(this.database.from.z - this.database.to.z) / 2,
    }
  }

  get edges(): [Vector3, Vector3] {
    return [this.database.from, this.database.to]
  }

  getFormDescription(): Record<string, unknown> {
    return {
      From: Vector.string(this.database.from, true),
      To: Vector.string(this.database.to, true),
    }
  }
}

export const RectangleArea = Rectangle.asSaveableArea()
