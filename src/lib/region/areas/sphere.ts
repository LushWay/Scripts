import { Vector3 } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { Area } from './area'

class Sphere extends Area<{ center: { x: number; z: number; y: number }; radius: number }> {
  type = 's'

  isVectorIn(vector: Vector3, dimensionId: Dimensions): boolean {
    return super.isVectorIn(vector, dimensionId) && this.isNear(vector, 0)
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

  isNear(vector: Vector3, distance: number): boolean {
    return Vector.distance(this.database.center, vector) < this.radius + distance
  }
}

export const SphereArea = Sphere.SaveableArea()
