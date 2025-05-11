import { StructureRotation } from '@minecraft/server'
import { structureLikeRotate, toAbsolute, toRelative } from './structure'

describe('structureLikeRotate', () => {
  const structure = {
    position: { x: 0, y: 0, z: 0 }, // This is actually position of the structure in the world. It can be any vector with any values.
    size: { x: 20, y: 12, z: 22 },
    vectors: [
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
      { x: 9, y: 1, z: 10 },
      { x: 13, y: 1, z: 15 },
    ])
  })

  it('should rotate 180', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate180, ...structure })
    expect(rotated).toEqual([
      { x: 10, y: 1, z: 9 },
      { x: 5, y: 1, z: 13 },
    ])
  })

  it('should rotate 270', () => {
    const rotated = structureLikeRotate({ rotation: StructureRotation.Rotate270, ...structure })
    expect(rotated).toEqual([
      { x: 13, y: 1, z: 10 },
      { x: 9, y: 1, z: 5 },
    ])
  })
})

describe('abso relo', () => {
  it('s', () => {
    const vector = { x: 1000, y: 1342, z: 5242 }
    const center = { x: 1000, y: 1000, z: 5000 }
    expect(toAbsolute(toRelative(vector, center), center)).toEqual(vector)
  })
})
