import { LimitedSet } from 'lib/database/persistent-set'
import { Vector } from 'lib/vector'

const blendStorage = new LimitedSet<string>(1_000)
const dontBlend = false

export function skipForBlending(
  { blending, radius, factor }: { blending: number; radius: number; factor: number },
  { vector, center }: { vector: Vector3; center: Vector3 },
) {
  if (blending === -1) return dontBlend

  const distance = ~~Vector.distance(vector, center)

  if (blending === 0) {
    // Outside of circle, skip
    if (distance > radius) return true
  } else {
    // Blending
    const toBlend = radius - blending
    if (radius > toBlend) {
      const vectorId = Vector.string(vector)
      if (blendStorage.has(vectorId)) return true

      const blendingFactor = 1 + factor * 0.01
      if (Math.randomInt(toBlend, radius) < distance * blendingFactor) {
        blendStorage.add(vectorId)
        return true
      }
    }
  }
}
