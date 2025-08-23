import { Vector3 } from '@minecraft/server'
import { AbstractPoint, toPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { Area } from './area'

class FlattenedSphere extends Area<{
  center: { x: number; y: number; z: number }
  rx: number
  ry: number
}> {
  type = 'fs'

  isNear(point: AbstractPoint, distance: number): boolean {
    const { location: vector, dimensionType } = toPoint(point)
    if (!this.isOurDimension(dimensionType)) return false

    const dx = vector.x - this.database.center.x
    const dz = vector.z - this.database.center.z

    return Math.hypot(dx, dz) <= this.rx + distance && Math.abs(vector.y - this.database.center.y) <= this.ry + distance
  }

  get edges(): [Vector3, Vector3] {
    const {
      rx,
      ry,
      center: { x, y, z },
    } = this.database
    return [
      { x: x - rx, y: y - ry, z: z - rx },
      { x: x + rx, y: y + ry, z: y + rx },
    ]
  }

  get radius() {
    return Math.max(this.rx, this.ry)
  }

  get rx() {
    return this.database.rx
  }

  set rx(r) {
    this.database.rx = r
  }

  get ry() {
    return this.database.ry
  }

  set ry(r) {
    this.database.ry = r
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
      ['Radius', this.rx],
      ['YRadius', this.ry],
    ]
  }
}

export const FlattenedSphereArea = FlattenedSphere.asSaveableArea()
