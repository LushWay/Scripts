import { StructureRotation } from '@minecraft/server'
import { Vector } from 'lib'
import { structureLikeRotate, toAbsolute, toRelative } from './structure'

describe('structureLikeRotate', () => {
  const structure = {
    position: { x: 0, y: 0, z: 0 }, // This is actually position of the structure in the world. It can be any vector with any values.
    size: { x: 20, y: 12, z: 22 },
    vectors: [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 1, z: 13 },
      { x: 15, y: 1, z: 9 },
    ],
  }

  it('should rotate none', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.None, ...structure })
    expect(rotated).toEqual(structure.vectors)
  })

  it('should rotate 90', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate90, ...structure })
    expect(rotated).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 8, y: 1, z: 11 },
      { x: 12, y: 1, z: 16 },
    ])
  })

  it('should rotate 180', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate180, ...structure })
    expect(rotated).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 9, y: 1, z: 8 },
      { x: 4, y: 1, z: 12 },
    ])
  })

  it('should rotate 270', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate270, ...structure })
    expect(rotated).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 15, y: 1, z: 11 },
      { x: 10, y: 1, z: 4 },
    ])
  })

  const vector1000 = Vector.multiply(Vector.one, 1000)
  const structure2 = {
    position: Vector.add(structure.position, vector1000),
    size: structure.size,
    vectors: structure.vectors.map(e => Vector.add(e, vector1000)),
  }

  it('should rotate none 1000', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.None, ...structure2 })
    expect(rotated).toEqual(structure2.vectors)
  })

  it('should rotate 90 1000', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate90, ...structure2 })
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vector {
          "x": 1000,
          "y": 1000,
          "z": 1000,
        },
        Vector {
          "x": 1008,
          "y": 1001,
          "z": 1011,
        },
        Vector {
          "x": 1012,
          "y": 1001,
          "z": 1016,
        },
      ]
    `)
  })

  it('should rotate 180 1000', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate180, ...structure2 })
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vector {
          "x": 1000,
          "y": 1000,
          "z": 1000,
        },
        Vector {
          "x": 1009,
          "y": 1001,
          "z": 1008,
        },
        Vector {
          "x": 1004,
          "y": 1001,
          "z": 1012,
        },
      ]
    `)
  })

  it('should rotate 270 1000', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate270, ...structure2 })
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vector {
          "x": 1000,
          "y": 1000,
          "z": 1000,
        },
        Vector {
          "x": 1014,
          "y": 1001,
          "z": 1009,
        },
        Vector {
          "x": 1010,
          "y": 1001,
          "z": 1004,
        },
      ]
    `)
  })
})

describe('abso relo', () => {
  it('s', () => {
    const vector = { x: 1000, y: 1342, z: 5242 }
    const center = { x: 1000, y: 1000, z: 5000 }
    expect(toAbsolute(toRelative(vector, center), center)).toEqual(vector)
  })
})
