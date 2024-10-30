import { LimitedSet } from 'lib/database/persistent-set'
import { Vector } from 'lib/vector'

const doNotBlendStorage = new LimitedSet<string>(1_000)

export function skipForBlending(
  { blending, radius, factor }: { blending: number; radius: number; factor: number },
  { vector, center }: { vector: Vector3; center: Vector3 },
) {
  const vectorId = Vector.string(vector)
  const dontBlend = () => {
    // doNotBlendStorage.add(vectorId)
    return false
  }

  if (blending === -1) return dontBlend()

  const distance = ~~Vector.distance(vector, center)

  // Outside of circle, skip
  if (distance > radius) return true
  if (blending === 0) return dontBlend()
  else {
    // Blending
    const toBlend = radius - blending

    if (radius > toBlend) {
      if (doNotBlendStorage.has(vectorId)) return true

      const blendingFactor = 1 + (100 - factor) * 0.01
      if (Math.randomInt(toBlend, radius) < distance * blendingFactor) return true
    }
  }

  return dontBlend()
}
