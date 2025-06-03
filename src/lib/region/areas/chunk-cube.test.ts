import { ChunkCubeArea } from './chunk-cube'

describe('ChunkCubeArea', () => {
  it('should show whenether is vector in region or not', () => {
    const chunk = new ChunkCubeArea({ from: { x: 0, z: 0 }, to: { x: 10, z: 10 } }, 'overworld')

    expect(chunk.isIn({ location: { x: 0, y: 10, z: 0 }, dimensionType: 'overworld' })).toBe(true)
    expect(chunk.isIn({ location: { x: 0, y: 10, z: 0 }, dimensionType: 'end' })).toBe(false)
    expect(chunk.isIn({ location: { x: -5, y: 10, z: 0 }, dimensionType: 'overworld' })).toBe(false)

    expect(chunk.center).toMatchInlineSnapshot(`
    {
      "x": 5,
      "y": 150.5,
      "z": 5,
    }
  `)

    expect(chunk.radius).toMatchInlineSnapshot(`214.6165184695717`)

    expect(chunk.size).toMatchInlineSnapshot(`
    Vec {
      "x": 10,
      "y": 429,
      "z": 10,
    }
  `)

    expect(chunk.isNear({ location: { x: 20, y: 0, z: 20 }, dimensionType: chunk.dimensionType }, 11)).toBe(true)
  })

  it('should calculate center for any coordinate ++', () => {
    const chunk = new ChunkCubeArea({ from: { x: 1000, z: 1000 }, to: { x: 1010, z: 1010 } }, 'overworld')
    expect(chunk.center).toMatchInlineSnapshot(`
      {
        "x": 1005,
        "y": 150.5,
        "z": 1005,
      }
    `)
  })

  it('should calculate center for any coordinate --', () => {
    const chunk = new ChunkCubeArea({ from: { x: -1000, z: -1000 }, to: { x: -1010, z: -1010 } }, 'overworld')
    expect(chunk.center).toMatchInlineSnapshot(`
      {
        "x": -1005,
        "y": 150.5,
        "z": -1005,
      }
    `)
  })

  it('should calculate center for any coordinate -+', () => {
    const chunk = new ChunkCubeArea({ from: { x: -1000, z: 1000 }, to: { x: -1010, z: 1010 } }, 'overworld')
    expect(chunk.center).toMatchInlineSnapshot(`
      {
        "x": -1005,
        "y": 150.5,
        "z": 1005,
      }
    `)
  })
})
