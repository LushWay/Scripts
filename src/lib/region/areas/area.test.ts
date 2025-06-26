import { Vector3 } from '@minecraft/server'
import { AbstractPoint } from 'lib/utils/point'
import { Area } from './area'

describe('area reg', () => {
  it('should trow', () => {
    class TestArea extends Area {
      getFormDescription(): Text.Table {
        throw new Error('Method not implemented.')
      }
      type = 'test'
      get edges(): [Vector3, Vector3] {
        throw new Error('Method not implemented.')
      }
      get center(): Vector3 {
        throw new Error('Method not implemented.')
      }
      isNear(point: AbstractPoint): boolean {
        throw new Error('Method not implemented.')
      }
    }

    const mock = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(TestArea.fromJson({ t: 'unknown', d: {} })).toMatchInlineSnapshot(`undefined`)
    expect(mock.mock.calls[0]?.[0]).toMatchInlineSnapshot(
      `"§7[Area][Database] No area found for §funknown§7. Maybe you forgot to register kind or import file?"`,
    )
    mock.mockClear()

    Area.loaded = true
    expect(() => {
      TestArea.asSaveableArea()
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: Registering area type test failed. Regions are already restored from json. Registering area should occur on the import-time.]`,
    )
  })
})
