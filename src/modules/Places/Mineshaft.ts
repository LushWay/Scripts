// TODO Actually generate ore

import { MineshaftRegion, actionGuard, util } from 'lib'
import { scheduleBlockPlace } from 'modules/Survival/scheduledBlockPlace'

class MineshaftBuilder {
  /**
   * @param {object} o
   * @param {Vector3} o.center
   * @param {number} o.minRadius
   * @param {number} o.maxRadius
   * @param {number} [o.numOres]
   * @returns {Vector3[]}
   */
  generateOre({ center, minRadius, maxRadius, numOres = Math.randomInt(0, maxRadius) }) {
    const orePositions = []

    console.debug({ numOres, maxRadius })

    for (let i = 0; i < numOres; i++) {
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.randomInt(minRadius, maxRadius)
      const x = center.x + r * Math.sin(phi) * Math.cos(theta)
      const y = center.y + r * Math.sin(phi) * Math.sin(theta)
      const z = center.z + r * Math.cos(phi)

      orePositions.push({ x, y, z })
    }

    return orePositions
  }

  constructor() {}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Mineshaft = new MineshaftBuilder()

// @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
actionGuard((player, region, ctx) => {
  if (region instanceof MineshaftRegion && ctx.type === 'break') {
    const { block, dimension } = ctx.event
    scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      restoreTime: util.ms.from('sec', Math.randomInt(10, 30)),
      typeId: block.type.id,
      states: block.permutation.getAllStates(),
    })

    return true
  }
})
