import { describe, expect, it } from 'vitest'
import { Vector } from './vector'

describe('vector extra functions', () => {
  it('should create around vectors', () => {
    expect(Vector.around(Vector.zero, 5)).toEqual([new Vector(5, 5, 5), new Vector(-5, -5, -5)])
    expect(Vector.around({ x: 10, y: 0, z: -5 }, 5)).toEqual([new Vector(15, 5, 0), new Vector(5, -5, -10)])
  })
})

