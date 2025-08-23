import { Vector3 } from '@minecraft/server'
import { AbstractPoint, toPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { Area } from './area'

interface RectangleDatabase extends JsonObject {
  from: { x: number; z: number; y: number }
  to: { x: number; z: number; y: number }
}

class Rectangle extends Area<RectangleDatabase> {
  constructor(database: RectangleDatabase, dimensionType?: DimensionType) {
    if (typeof database.from === 'object') {
      const from = Vec.min(database.from, database.to)
      const to = Vec.max(database.from, database.to)
      database.from = from
      database.to = to
    }
    super(database, dimensionType)
  }

  type = 'rect'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { location: vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    const { from, to } = this.database

    return Vec.isBetween(
      distance === 0 ? from : Vec.add(from, { x: -distance, y: -distance, z: -distance }),
      distance === 0 ? to : Vec.add(to, { x: distance, y: distance, z: distance }),
      vector,
    )
  }

  get center() {
    const { from, to } = this.database
    return Vec.center(from, to)
  }

  get edges(): [Vector3, Vector3] {
    return [this.database.from, this.database.to]
  }

  getFormDescription(): Text.Table {
    return [
      ['From', Vec.string(this.database.from, true)],
      ['To', Vec.string(this.database.to, true)],
      ['Center', Vec.string(this.center, true)],
      ['Size', Vec.size(this.database.from, this.database.to)],
    ]
  }
}

export const RectangleArea = Rectangle.asSaveableArea()
