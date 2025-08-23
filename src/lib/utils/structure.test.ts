import { StructureRotation } from '@minecraft/server'
import { Vec } from 'lib'
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
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 21,
          "y": 0,
          "z": 0,
        },
        Vec {
          "x": 8,
          "y": 1,
          "z": 10,
        },
        Vec {
          "x": 12,
          "y": 1,
          "z": 15,
        },
      ]
    `)
  })

  it('should rotate 180', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate180, ...structure })
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 19,
          "y": 0,
          "z": 21,
        },
        Vec {
          "x": 9,
          "y": 1,
          "z": 8,
        },
        Vec {
          "x": 4,
          "y": 1,
          "z": 12,
        },
      ]
    `)
  })

  it('should rotate 270', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate270, ...structure })
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 0,
          "y": 0,
          "z": 19,
        },
        Vec {
          "x": 13,
          "y": 1,
          "z": 9,
        },
        Vec {
          "x": 9,
          "y": 1,
          "z": 4,
        },
      ]
    `)
  })

  const vector1000 = Vec.multiply(Vec.one, 1000)
  const structure2 = {
    position: Vec.add(structure.position, vector1000),
    size: structure.size,
    vectors: structure.vectors.map(e => Vec.add(e, vector1000)),
  }

  it('should rotate none 1000', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.None, ...structure2 })
    expect(rotated).toEqual(structure2.vectors)
  })

  it('should rotate 90 1000', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate90, ...structure2 })
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 1021,
          "y": 1000,
          "z": 1000,
        },
        Vec {
          "x": 1008,
          "y": 1001,
          "z": 1010,
        },
        Vec {
          "x": 1012,
          "y": 1001,
          "z": 1015,
        },
      ]
    `)
  })

  it('should rotate 180 1000', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate180, ...structure2 })
    expect(rotated).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 1019,
          "y": 1000,
          "z": 1021,
        },
        Vec {
          "x": 1009,
          "y": 1001,
          "z": 1008,
        },
        Vec {
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
        Vec {
          "x": 1000,
          "y": 1000,
          "z": 1019,
        },
        Vec {
          "x": 1013,
          "y": 1001,
          "z": 1009,
        },
        Vec {
          "x": 1009,
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
