/**
 * @param {Vector3} centerPos
 * @param {number} minRadius
 * @param {number} maxRadius
 */
export function generateOre(centerPos, minRadius, maxRadius) {
  const orePositions = []

  // Generate a random number of ores within the specified radius of the center position
  const numOres = Math.randomInt(0, maxRadius)
  console.debug({ numOres, maxRadius })

  for (let i = 0; i < numOres; i++) {
    const theta = 2 * Math.PI * Math.random()
    const phi = Math.acos(2 * Math.random() - 1)
    const r = Math.randomInt(minRadius, maxRadius)
    const x = centerPos.x + r * Math.sin(phi) * Math.cos(theta)
    const y = centerPos.y + r * Math.sin(phi) * Math.sin(theta)
    const z = centerPos.z + r * Math.cos(phi)

    orePositions.push({ x, y, z })
  }

  return orePositions
}
