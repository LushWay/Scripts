import { Vector3 } from '@minecraft/server'
import { Area } from './area'

class FlattenedSphere extends Area<{
  center: { x: number; y: number; z: number }
  rx: number
  ry: number
}> {
  type = 'fs'

  isVectorIn(vector: Vector3, dimensionId: Dimensions): boolean {
    return super.isVectorIn(vector, dimensionId) && this.isNear(vector, 0)
  }

  get edges(): [Vector3, Vector3] {
    const {
      rx,
      ry,
      center: { x, y, z },
    } = this.database
    return [
      { x: x + rx, y: y + ry, z: z + rx },
      { x: x - rx, y: y - ry, z: y - rx },
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

  isNear(vector: Vector3, distance: number): boolean {
    const dx = vector.x - this.database.center.x
    const dz = vector.z - this.database.center.z

    return Math.hypot(dx, dz) <= this.rx + distance && Math.abs(vector.y - this.database.center.y) <= this.ry + distance
  }
}

export const FlattenedSphereArea = FlattenedSphere.SaveableArea()
