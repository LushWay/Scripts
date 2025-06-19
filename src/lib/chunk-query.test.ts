import { Vec } from 'lib/vector'
import { ChunkArea, ChunkQuery } from './chunk-query'
import { SphereArea } from './region/areas/sphere'
import { createPoint, VectorInDimension } from './utils/point'

describe('ChunkQuery', () => {
  describe('Vector', () => {
    it('should query for single vector', () => {
      const query = createVectorQuery()

      query.add(createVectorPoint(16, 16, 16, 1))
      query.add(createVectorPoint(17, 17, 17, 2))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: 16  z: 16
        x: 16  z: 16

          2
        "
      `)
      query.add(createVectorPoint(100, 100, 100, 3))

      query.add(createVectorPoint(100, 100, 100, 4, 'end'))

      expect(query.getAt(createPoint(1, 1, 1)).map(byId)).toEqual([])
      expect(query.getAt(createPoint(16, 16, 16)).map(byId)).toEqual([1])
      expect(query.getAt(createPoint(17, 17, 17)).map(byId)).toEqual([2])
      expect(query.getAt(createPoint(18, 18, 18)).map(byId)).toEqual([])
      expect(query.getAt(createPoint(100, 100, 100)).map(byId)).toEqual([3])
      expect(query.getAt(createPoint(100, 100, 100, 'end')).map(byId)).toEqual([4])

      expect(query.getNear(createPoint(15, 15, 15), 5).map(byId)).toMatchInlineSnapshot(`
        [
          1,
          2,
        ]
      `)
    })

    it('should handle negative coordinates', () => {
      const query = createVectorQuery()

      query.add(createVectorPoint(-16, 0, -16, 10))
      query.add(createVectorPoint(-1, 0, -1, 11))
      query.add(createVectorPoint(-32, 0, -32, 12))

      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -32  z: -32
        x: -16  z: -16

          1  *
          *  2
        "
      `)

      expect(query.getAt(createPoint(-16, 0, -16)).map(byId)).toEqual([10])
      expect(query.getAt(createPoint(-1, 0, -1)).map(byId)).toEqual([11])
      expect(query.getAt(createPoint(-32, 0, -32)).map(byId)).toEqual([12])
      expect(query.getAt(createPoint(-100, 0, -100)).map(byId)).toEqual([])
    })

    it('should inspect api calls for area', () => {
      const query = createVectorQuery()
      const point = createVectorPoint(1, 1, 1, 10)
      const isObjectAt = vi.spyOn(query, 'isObjectAt')
      const isObjectNear = vi.spyOn(query, 'isObjectNear')
      const isObjectIn = vi.spyOn(query, 'isObjectIn')
      const getObjectEdges = vi.spyOn(query as unknown as { getObjectEdges: VoidFunction }, 'getObjectEdges')
      const getObjectDimension = vi.spyOn(
        query as unknown as { getObjectDimension: VoidFunction },
        'getObjectDimension',
      )
      const getStats = () =>
        Object.entries({
          isObjectAt,
          isObjectNear,
          isObjectIn,
          getObjectEdges,
          getObjectDimension,
        })
          .filter(e => e[1].mock.calls.length)
          .map(e => {
            const calls = e[1].mock.calls.length
            e[1].mockClear()
            return e[0] + ': ' + calls
          })
          .join('\n')

      query.add(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "getObjectEdges: 1
        getObjectDimension: 1"
      `)

      expect(query.getAt(createPoint(1, 1, 1)).map(byId)).toEqual([10])
      expect(getStats()).toMatchInlineSnapshot(`"isObjectAt: 1"`)

      expect(query.getNear(createPoint(2, 2, 2), 5).map(byId)).toEqual([10])
      expect(getStats()).toMatchInlineSnapshot(`"isObjectNear: 1"`)

      query.remove(point)
      expect(getStats()).toMatchInlineSnapshot(`"getObjectDimension: 1"`)
    })

    it('should remove points correctly', () => {
      const query = createVectorQuery()

      const pt1 = createVectorPoint(5, 0, 5, 20)
      const pt2 = createVectorPoint(-5, 0, -5, 21)
      query.add(pt1)
      query.add(pt2)

      expect(query.getAt(createPoint(5, 0, 5)).map(byId)).toEqual([20])
      expect(query.getAt(createPoint(-5, 0, -5)).map(byId)).toEqual([21])

      query.remove(pt1)
      expect(query.getAt(createPoint(5, 0, 5)).map(byId)).toEqual([])

      query.remove(pt2)
      expect(query.getAt(createPoint(-5, 0, -5)).map(byId)).toEqual([])
    })
  })

  describe('Area', () => {
    it('should inspect api calls for area', () => {
      const query = createSphereQuery()
      const point = createSpherePoint(1, 1, 1, 10)
      const isObjectAt = vi.spyOn(query, 'isObjectAt')
      const isObjectNear = vi.spyOn(query, 'isObjectNear')
      const pointIsIn = vi.spyOn(point, 'isIn')
      const pointIsNear = vi.spyOn(point, 'isNear')
      const getObjectEdges = vi.spyOn(query as unknown as { getObjectEdges: VoidFunction }, 'getObjectEdges')
      const getObjectDimension = vi.spyOn(
        query as unknown as { getObjectDimension: VoidFunction },
        'getObjectDimension',
      )
      const getStats = () =>
        Object.entries({
          isObjectAt,
          isObjectNear,
          pointIsIn,
          pointIsNear,
          getObjectEdges,
          getObjectDimension,
        })
          .filter(e => e[1].mock.calls.length)
          .map(e => {
            const calls = e[1].mock.calls.length
            e[1].mockClear()
            return e[0] + ': ' + calls
          })
          .join('\n')

      query.add(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "getObjectEdges: 1
        getObjectDimension: 1"
      `)

      query.add(createSpherePoint(1, 1, 3, 11))
      query.add(createSpherePoint(1, 3, 3, 12))
      query.add(createSpherePoint(1, 1, 300, 12))
      query.add(createSpherePoint(1, 1, 100, 12))
      query.add(createSpherePoint(1, 1, 17, 12))
      expect(getStats()).toMatchInlineSnapshot(`
        "getObjectEdges: 5
        getObjectDimension: 5"
      `)

      expect(query.getAt(createPoint(0, 0, 0)).map(byRadius)).toMatchInlineSnapshot(`
        [
          10,
          11,
          12,
        ]
      `)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 4
        pointIsIn: 1
        pointIsNear: 1"
      `)

      expect(query.getAt(createPoint(100, 0, 0)).map(byRadius)).toEqual([])
      expect(getStats()).toMatchInlineSnapshot(`""`)

      expect(query.getNear(createPoint(15, 15, 15), 7).map(byRadius)).toEqual([])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectNear: 4
        pointIsNear: 1"
      `)

      query.remove(point)
      expect(getStats()).toMatchInlineSnapshot(`"getObjectDimension: 1"`)
    })

    it('should add to the area', () => {
      const query = createSphereQuery()

      expect(query.add(createSpherePoint(0, 0, 0, 36)).length).toMatchInlineSnapshot(`36`)
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -48  z: -48
        x: 32  z: 32

          1  1  1  1  1  1
          1  1  1  1  1  1
          1  1  1  1  1  1
          1  1  1  1  1  1
          1  1  1  1  1  1
          1  1  1  1  1  1
        "
      `)
      expect(query.storageSize()).toMatchInlineSnapshot(`
        {
          "chunks": 36,
          "objects": 36,
        }
      `)

      expect(query.add(createSpherePoint(0, 0, 100, 8)).length).toMatchInlineSnapshot(`4`)
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -48  z: -48
        x: 32  z: 96

          1  1  1  1  1  1  *  *  *  *
          1  1  1  1  1  1  *  *  *  *
          1  1  1  1  1  1  *  *  1  1
          1  1  1  1  1  1  *  *  1  1
          1  1  1  1  1  1  *  *  *  *
          1  1  1  1  1  1  *  *  *  *
        "
      `)
    })

    it('should query for area', () => {
      const query = createSphereQuery()
      expect(inspectChunks(query)).toMatchInlineSnapshot(`"Empty"`)

      query.add(createSpherePoint(-1, -1, -1, 3))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -16
        x: 0  z: 0

          1  1
          1  1
        "
      `)

      query.add(createSpherePoint(1, 1, 1, 2))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -16
        x: 0  z: 0

          1  1
          1  2
        "
      `)
      query.add(createSpherePoint(16, 16, 16, 3))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -16
        x: 16  z: 16

          1  1  *
          1  3  1
          *  1  1
        "
      `)

      query.add(createSpherePoint(17, 17, 17, 4))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -16
        x: 16  z: 16

          1  1  *
          1  4  2
          *  2  2
        "
      `)

      query.add(createSpherePoint(100, 100, 100, 5))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -16
        x: 96  z: 96

          1  1  *  *  *  *  *  *
          1  4  2  *  *  *  *  *
          *  2  2  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  1
        "
      `)

      query.add(createSpherePoint(100, 100, 100, 6, 'end'))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -16
        x: 96  z: 96

          1  1  *  *  *  *  *  *
          1  4  2  *  *  *  *  *
          *  2  2  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  1
        "
      `)

      expect(query.getAt(createPoint(0, 0, 0)).map(byRadius)).toEqual([3, 2])
      expect(query.getAt(createPoint(1, 1, 1)).map(byRadius)).toEqual([2])
      expect(query.getAt(createPoint(1, 1, 2)).map(byRadius)).toEqual([2])
      expect(query.getAt(createPoint(1, 1, 3)).map(byRadius)).toEqual([])
      expect(query.getAt(createPoint(1, 1, 4)).map(byRadius)).toEqual([])

      expect(query.getAt(createPoint(16, 16, 16)).map(byRadius)).toEqual([3, 4])
      expect(query.getAt(createPoint(17, 17, 17)).map(byRadius)).toEqual([3, 4])
      expect(query.getAt(createPoint(18, 18, 18)).map(byRadius)).toEqual([4])
      expect(query.getAt(createPoint(25, 25, 25)).map(byRadius)).toEqual([])
      expect(query.getAt(createPoint(100, 100, 100)).map(byRadius)).toEqual([5])
      expect(query.getAt(createPoint(100, 100, 100, 'end')).map(byRadius)).toEqual([6])

      expect(query.getNear(createPoint(15, 15, 15), 5).map(byRadius)).toMatchInlineSnapshot(`
      [
        3,
        4,
      ]
    `)
    })

    it('query.getNear should work same as iteration', () => {
      const points = [
        createSpherePoint(0, 0, 0, 10),
        createSpherePoint(0, 0, 5, 11),
        createSpherePoint(0, 5, 0, 12),
        createSpherePoint(5, 5, 5, 13),
        createSpherePoint(-5, 0, 0, 14),
      ]
      const neverHitPoint = createSpherePoint(0, 0, 46, 15)
      const spy = vi.spyOn(neverHitPoint, 'isNear')
      points.push(neverHitPoint)

      const point = createPoint(5, 0, 0)
      const iteration = (point: VectorInDimension) => points.filter(e => e.isNear(point, 10)).map(byRadius)

      expect(iteration(point)).toMatchInlineSnapshot(`
        [
          10,
          11,
          12,
          13,
          14,
        ]
      `)
      expect(spy).toHaveBeenCalledTimes(1)

      const query = createSphereQuery()
      points.forEach(e => query.add(e))

      spy.mockClear()

      expect(query.getNear(point, 10).map(byRadius).sort()).toMatchInlineSnapshot(`
        [
          10,
          11,
          12,
          13,
          14,
        ]
      `)

      expect(spy).toHaveBeenCalledTimes(0)

      const newPoint = createPoint(3.14, 4.0, 6.88)
      expect(query.getNear(newPoint, 10).map(byRadius).sort()).toEqual(iteration(newPoint))
    })

    it('should work with decimals', () => {
      const query = createSphereQuery()

      query.add(createSpherePoint(-1321, 88, 14816, 200))

      expect(query.getAt(createPoint(-1359, 88, 14815)).map(byRadius)).toEqual([200])
      expect(query.getAt(createPoint(-1360.35, 88.0, 14815.53)).map(byRadius)).toEqual([200])
      expect(query.getAt(createPoint(-1361, 88, 14815)).map(byRadius)).toEqual([200])
      expect(query.getAt(createPoint(-1362, 88, 14815)).map(byRadius)).toEqual([200])
    })

    it('should handle negative coordinates', () => {
      const query = createSphereQuery()

      query.add(createSpherePoint(-16, 0, -16, 10))
      query.add(createSpherePoint(-1, 0, -1, 11))
      query.add(createSpherePoint(-32, 0, -32, 12))

      expect(query.getAt(createPoint(-16, 0, -16)).map(byRadius)).toEqual([10])
      expect(query.getAt(createPoint(-1, 0, -1)).map(byRadius)).toEqual([11])
      expect(query.getAt(createPoint(-32, 0, -32)).map(byRadius)).toEqual([12])
      expect(query.getAt(createPoint(-100, 0, -100)).map(byRadius)).toEqual([])
    })

    it('should remove areas correctly', () => {
      const query = createSphereQuery()

      const area1 = createSpherePoint(5, 0, 5, 2)
      const area2 = createSpherePoint(-5, 0, -35, 6)

      query.add(area1)
      query.add(area2)

      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -48
        x: 0  z: 0

          1  1  *  *
          1  1  *  1
        "
      `)

      expect(query.getAt(createPoint(5, 0, 5)).map(byRadius)).toEqual([2])
      expect(query.getAt(createPoint(-5, 0, -35)).map(byRadius)).toEqual([6])

      query.remove(area1)
      expect(query.getAt(createPoint(5, 0, 5)).map(byRadius)).toEqual([])
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "
        x: -16  z: -48
        x: 0  z: -32

          1  1
          1  1
        "
      `)

      query.remove(area2)
      expect(query.getAt(createPoint(-5, 0, -35)).map(byRadius)).toEqual([])
      expect(inspectChunks(query)).toMatchInlineSnapshot(`"Empty"`)
    })
  })

  describe('ChunkArea', () => {
    it('should create area in ++', () => {
      expect(new ChunkArea(0, 0, 'overworld')).toMatchInlineSnapshot(`
        {
          "from": "0 0",
          "key": "0 0 16",
          "to": "15 15",
        }
      `)
    })
    it('should create area in --', () => {
      expect(new ChunkArea(-16, -16, 'overworld')).toMatchInlineSnapshot(`
        {
          "from": "-16 -16",
          "key": "-1 -1 16",
          "to": "-1 -1",
        }
      `)
    })

    it('should create area in --', () => {
      expect(new ChunkArea(0, 1211, 'overworld')).toMatchInlineSnapshot(`
        {
          "from": "0 1200",
          "key": "0 75 16",
          "to": "15 1215",
        }
      `)
    })
  })
})

function createSphereQuery() {
  return new ChunkQuery<InstanceType<typeof SphereArea>>(
    (vector, object) => object.isIn({ location: vector, dimensionType: object.dimensionType }),
    (vector, object, distance) => object.isNear({ location: vector, dimensionType: object.dimensionType }, distance),
    (chunk, object) =>
      object.isNear(
        { dimensionType: chunk.dimensionType, location: { ...chunk.center, y: object.center.y } },
        ChunkArea.size,
      ),
    object => object.dimensionType,
    object => object.edges,
  )
}

function createSpherePoint(x: number, y: number, z: number, radius: number, dimensionType?: DimensionType) {
  return new SphereArea({ center: { x, y, z }, radius: radius }, dimensionType)
}

function createVectorQuery() {
  return new ChunkQuery<VectorInDimension & { id: number }>(
    (point, object) => Vec.equals(point, object.location),
    (vector, object, distance) => Vec.isInsideRadius(vector, object.location, distance + 1),
    () => true,
    object => object.dimensionType,
    object => [object.location, object.location] as const,
  )
}

function createVectorPoint(x: number, y: number, z: number, id: number, dimensionType?: DimensionType) {
  return { ...createPoint(x, y, z, dimensionType), id }
}

function byId(object: { id: number }) {
  if (object && 'id' in object) return object.id
  return object
}

function byRadius(object: { radius: number }) {
  if (object && 'radius' in object) return object.radius
  return object
}

function inspectChunks(query: ChunkQuery, dimensionType: DimensionType = 'overworld') {
  let results: (VectorXZ & { v: string })[] = []

  let fromX
  let fromZ
  let toX
  let toZ

  for (const chunk of query.getStorage(dimensionType).values()) {
    const x = chunk.from.x
    const z = chunk.from.z

    const result = '' + chunk.storageSize()

    fromX ??= x
    fromZ ??= z
    toX ??= x
    toZ ??= z

    fromX = Math.min(fromX, x)
    fromZ = Math.min(fromZ, z)
    toX = Math.max(toX, x)
    toZ = Math.max(toZ, z)

    results.push({ x, z, v: result })
  }

  if (typeof fromX === 'number' && typeof toX === 'number' && typeof toZ === 'number' && typeof fromZ === 'number') {
    let result = `\nx: ${fromX ?? 0}  z: ${fromZ ?? 0}\nx: ${toX ?? 0}  z: ${toZ ?? 0}\n\n`
    for (let x = fromX; x <= toX; x += 16) {
      for (let z = fromZ; z <= toZ; z += 16) {
        const point = results.find(e => e.x === x && e.z === z)
        const v = point ? point.v : '*'
        result += ' ' + v.padStart(2, ' ')
      }
      result += '\n'
    }
    return result
  } else {
    return 'Empty'
  }
}
