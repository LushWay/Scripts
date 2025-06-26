import { AbstractPoint, toPoint } from 'lib/utils/point'
import { Vec, VecXZ } from 'lib/vector'
import { Area } from './area'

class Cylinder extends Area<{ center: { x: number; z: number; y: number }; radius: number; yradius: number }> {
  type = 'ss'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { location: vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    return (
      Math.abs(this.database.center.y - vector.y) <= this.database.yradius + distance &&
      VecXZ.isInsideRadius(this.database.center, vector, this.database.radius + distance)
    )
  }

  get edges() {
    const x = this.database.radius - 1
    return Vec.around(this.database.center, x, this.database.yradius - 1, x)
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
      ['YRadius', this.database.yradius],
    ]
  }
}

export const CylinderArea = Cylinder.asSaveableArea()
