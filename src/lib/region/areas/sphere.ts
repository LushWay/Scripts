import { AbstractPoint, toPoint } from 'lib/game-utils'
import { Vector } from 'lib/vector'
import { Area } from './area'

class Sphere extends Area<{ center: { x: number; z: number; y: number }; radius: number }> {
  type = 's'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    return Vector.distance(this.database.center, vector) < this.radius + distance
  }

  get edges() {
    return Vector.around(this.database.center, this.database.radius - 1)
  }

  get radius() {
    return this.database.radius
  }

  set radius(r) {
    this.database.radius = r
  }

  get center() {
    return this.database.center
  }

  set center(c) {
    this.database.center = c
  }
}

export const SphereArea = Sphere.asSaveableArea()
