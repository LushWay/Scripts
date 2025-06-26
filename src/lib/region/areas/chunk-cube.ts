import { Vector3 } from '@minecraft/server'
import { AbstractPoint, toPoint } from 'lib/utils/point'
import { VecXZ } from 'lib/vector'
import { Area } from './area'

interface ChunkCubeDatabase extends JsonObject {
  from: VectorXZ
  to: VectorXZ
}

class ChunkCube extends Area<ChunkCubeDatabase> {
  constructor(database: ChunkCubeDatabase, dimensionType?: DimensionType) {
    if (typeof database.from === 'object') {
      const from = VecXZ.min(database.from, database.to)
      const to = VecXZ.max(database.from, database.to)
      database.from = from
      database.to = to
    }
    super(database, dimensionType)
  }

  type = 'c'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { location: vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    const { from, to } = this.database

    return VecXZ.isBetween(
      distance === 0 ? from : VecXZ.add(from, { x: -distance, z: -distance }),
      distance === 0 ? to : VecXZ.add(to, { x: distance, z: distance }),
      vector,
    )
  }

  private centerY =
    this.dimension.heightRange.min + (this.dimension.heightRange.max - this.dimension.heightRange.min) / 2

  get center() {
    const { from, to } = this.database
    const { x, z } = VecXZ.center(from, to)
    return { x, y: this.centerY, z }
  }

  getFormDescription(): Text.Table {
    return [
      ['From', `${this.database.from.x} ${this.database.from.z}`],
      ['To', `${this.database.to.x} ${this.database.to.z}`],
    ]
  }

  get edges(): [Vector3, Vector3] {
    const { max, min } = this.dimension.heightRange
    const { from, to } = this.database
    return [
      { x: from.x, y: min, z: from.z },
      { x: to.x, y: max, z: to.z },
    ]
  }
}

export const ChunkCubeArea = ChunkCube.asSaveableArea()
