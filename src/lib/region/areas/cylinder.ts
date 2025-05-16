import { AbstractPoint, toPoint } from 'lib/game-utils'
import { Vector } from 'lib/vector'
import { Area } from './area'

class Cylinder extends Area<{ center: { x: number; z: number; y: number }; radius: number; yradius: number }> {
  type = 'ss'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    return (
      Math.abs(this.database.center.y - vector.y) <= this.database.yradius + distance &&
      Vector.distance(
        { x: this.database.center.x, y: 0, z: this.database.center.z },
        { x: vector.x, y: 0, z: vector.z },
      ) <
        this.database.radius + distance
    )
  }

  get edges() {
    const x = this.database.radius - 1
    return Vector.around(this.database.center, x, this.database.yradius - 1, x)
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

  getFormDescription(): Record<string, unknown> {
    return { Center: Vector.string(this.center, true), Radius: this.radius, YRadius: this.database.yradius }
  }
}

export const CylinderArea = Cylinder.asSaveableArea()
