import { LimitedSet } from 'lib/database/persistent-set'
import { Vector } from 'lib/vector'

const blendStorage = new LimitedSet<string>(1_000)

function blend(vectorId: string) {
  blendStorage.add(vectorId)
  return true
}

const dontBlend = false

export function skipForBlending(
  { blending, radius, factor }: { blending: number; radius: number; factor: number },
  { vector, center }: { vector: Vector3; center: Vector3 },
) {
  if (blending <= 0) return dontBlend

  const vectorId = Vector.string(vector)
  if (blendStorage.has(vectorId)) return true

  const distance = ~~Vector.distance(vector, center)

  // Circle
  if (distance > radius) return blend(vectorId)

  // Blending
  if (blending > 0 && blending < radius) {
    const blendingFactor = 1 + factor * 0.01
    if (Math.randomInt(radius - blending, radius) < distance * blendingFactor) return blend(vectorId)
  }
}
