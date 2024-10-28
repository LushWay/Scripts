import { ChunkCubeArea } from './chunk-cube'

it('should show whenether is vector in region or not', () => {
  const chunk = new ChunkCubeArea({ from: { x: 0, z: 0 }, to: { x: 10, z: 10 } }, 'overworld')

  expect(chunk.isVectorIn({ x: 0, y: 10, z: 0 }, 'overworld')).toBe(true)
  expect(chunk.isVectorIn({ x: 0, y: 10, z: 0 }, 'end')).toBe(false)
  expect(chunk.isVectorIn({ x: -5, y: 10, z: 0 }, 'overworld')).toBe(false)

  expect(chunk.center).toMatchInlineSnapshot(`
    {
      "x": 5,
      "y": 397,
      "z": 5,
    }
  `)

  expect(chunk.radius).toMatchInlineSnapshot(`214.6165184695717`)

  expect(chunk.size).toMatchInlineSnapshot(`
    Vector {
      "x": -10,
      "y": 429,
      "z": -10,
    }
  `)

  expect(chunk.isNear({ x: 20, y: 0, z: 20 }, 11)).toBe(true)
})
