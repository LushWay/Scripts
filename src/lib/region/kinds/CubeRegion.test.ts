import 'lib/load/extensions'
import { Vector } from 'lib/vector'
import { describe, expect, it } from 'vitest'
import { RegionDatabase } from '../database'
import { CubeRegion } from './CubeRegion'

describe('CubeRegion', () => {
  it('should show whenether is vector in region or not', () => {
    const region = CubeRegion.create({ from: { x: 0, z: 0 }, to: { x: 0, z: 0 }, dimensionId: 'overworld' })

    expect(region.isVectorInRegion({ x: 0, y: 10, z: 0 }, 'overworld')).toBe(true)
    expect(region.isVectorInRegion({ x: 0, y: 10, z: 0 }, 'end')).toBe(false)
    expect(region.isVectorInRegion({ x: -5, y: 10, z: 0 }, 'overworld')).toBe(false)
  })

  it('should not save non saveable cube region', () => {
    class NonSaveableCubeRegion extends CubeRegion {
      protected saveable = false

      get regionKey() {
        return this.key
      }
    }

    const region = NonSaveableCubeRegion.create({ from: Vector.zero, to: Vector.zero, dimensionId: 'overworld' })

    expect(RegionDatabase[region.regionKey]).toBeUndefined()
  })
})
