import { Vector3 } from '@minecraft/server'
import { Area } from './area'

describe('area reg', () => {
  it('should trow', () => {
    class TestArea extends Area {
      type = 'test'
      get edges(): [Vector3, Vector3] {
        throw new Error('Method not implemented.')
      }
      get center(): Vector3 {
        throw new Error('Method not implemented.')
      }
      isNear(vector: Vector3, distance: number): boolean {
        throw new Error('Method not implemented.')
      }
    }

    Area.loaded = true
    expect(() => {
      TestArea.SaveableArea()
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: Registering area type test failed. Regions are already restored from json. Registering area should occur on the import-time.]`,
    )
  })
})
