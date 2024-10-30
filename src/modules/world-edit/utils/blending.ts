import { LimitedSet } from 'lib/database/persistent-set'
import { Vector } from 'lib/vector'

const blendStorage = new LimitedSet<string>(1_000)
const dontBlend = false

export function skipForBlending(
  { blending, radius, factor }: { blending: number; radius: number; factor: number },
  { vector, center }: { vector: Vector3; center: Vector3 },
) {
  if (blending === -1) return dontBlend

  const vectorId = Vector.string(vector)
  if (blendStorage.has(vectorId)) return true

  const distance = ~~Vector.distance(vector, center)

  if (blending === 0) {
    // Circle
    if (distance > radius) return true
  } else {
    // Blending
    if (blending < radius) {
      const blendingFactor = 1 + factor * 0.01
      if (Math.randomInt(radius - blending, radius) < distance * blendingFactor) {
        blendStorage.add(vectorId)
        return true
      }
    }
  }
}
