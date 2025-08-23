import { AbstractPoint, toPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { Area } from './area'

class Sphere extends Area<{ center: { x: number; z: number; y: number }; radius: number }> {
  type = 's'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { location: vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    return Vec.isInsideRadius(this.database.center, vector, this.radius + distance)
  }

  get edges() {
    return Vec.around(this.database.center, this.database.radius - 1)
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

  getFormDescription(): Text.Table {
    return [
      ['Center', Vec.string(this.center, true)],
      ['Radius', this.radius],
    ]
  }
}

export const SphereArea = Sphere.asSaveableArea()
