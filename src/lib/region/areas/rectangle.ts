import { Vector3 } from '@minecraft/server'
import { AbstractPoint, toPoint } from 'lib/game-utils'
import { Vector } from 'lib/vector'
import { Area } from './area'

interface RectangleDatabase extends JsonObject {
  from: { x: number; z: number; y: number }
  to: { x: number; z: number; y: number }
}

class Rectangle extends Area<RectangleDatabase> {
  constructor(database: RectangleDatabase, dimensionType?: DimensionType) {
    if (typeof database.from === 'object') {
      const from = Vector.min(database.from, database.to)
      const to = Vector.max(database.from, database.to)
      database.from = from
      database.to = to
    }
    super(database, dimensionType)
  }

  type = 'rect'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    const [from, to] = this.edges

    return Vector.between(
      distance === 0 ? from : Vector.add(from, { x: -distance, y: -distance, z: -distance }),
      distance === 0 ? to : Vector.add(to, { x: distance, y: distance, z: distance }),
      vector,
    )
  }

  get center() {
    const [from, to] = this.edges
    return {
      x: from.x + (to.x - from.x) / 2,
      y: from.y + (to.y - from.y) / 2,
      z: from.z + (to.z - from.z) / 2,
    }
  }

  get edges(): [Vector3, Vector3] {
    return [this.database.from, this.database.to]
  }

  getFormDescription(): Record<string, unknown> {
    return {
      From: Vector.string(this.database.from, true),
      To: Vector.string(this.database.to, true),
      Center: Vector.string(this.center, true),
      Size: Vector.size(this.database.from, this.database.to),
    }
  }
}

export const RectangleArea = Rectangle.asSaveableArea()
