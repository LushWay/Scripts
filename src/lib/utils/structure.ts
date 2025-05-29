import { StructureRotation } from '@minecraft/server'
import { Vec } from 'lib/vector'

export function structureLikeRotate({
  rotation,
  position,
  size,
  vectors,
}: {
  rotation: StructureRotation
  position: Vector3
  size: Vector3
  vectors: Vector3[]
}) {
  if (rotation === StructureRotation.None) return vectors
  return vectors.map(vector => {
    const relative = Vec.subtract(vector, position)
    const rotatedRelative = structureLikeRotateRelative(rotation, relative, size)
    return Vec.add(rotatedRelative, position) as Vector3
  })
}

export function structureLikeRotateRelative(rotation: StructureRotation, relative: Vector3, size: Vector3): Vector3 {
  switch (rotation) {
    case StructureRotation.None:
      return relative

    case StructureRotation.Rotate90:
      return {
        x: size.z - 1 - relative.z,
        y: relative.y,
        z: relative.x,
      }

    case StructureRotation.Rotate180:
      return {
        x: size.x - 1 - relative.x,
        y: relative.y,
        z: size.z - 1 - relative.z,
      }

    case StructureRotation.Rotate270:
      return {
        x: relative.z,
        y: relative.y,
        z: size.x - 1 - relative.x,
      }

    default:
      return { ...relative }
  }
}

export function toAbsolute(vector: Vector3, center: Vector3) {
  return Vec.add(vector, center)
}

export function toRelative(vector: Vector3, center: Vector3) {
  return Vec.subtract(vector, center)
}
