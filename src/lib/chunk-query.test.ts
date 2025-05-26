import { createPoint } from 'lib/game-utils'
import { Vector } from 'lib/vector'
import { Chunk, Chunk64, ChunkArea, ChunkQuery } from './chunk-query'
import { STOP_AREA_FOR_EACH_VECTOR } from './region/areas/area'
import { SphereArea } from './region/areas/sphere'

function byId(object: { id: number }) {
  if (object && 'id' in object) return object.id
  return object
}

function byRadius(object: { radius: number }) {
  if (object && 'radius' in object) return object.radius
  return object
}

function inspectChunks(query: ChunkQuery, dimensionType: DimensionType = 'overworld') {
  const chunkToString = (e: Chunk): unknown =>
    e instanceof Chunk64
      ? '[' + (ChunkQuery.getChunks(e).get(dimensionType)?.map(chunkToString) ?? []).join(' ') + ']'
      : e.getSize(dimensionType, query).objects
  return (ChunkQuery.getChunks(query)?.get(dimensionType)?.map(chunkToString) ?? []).join('\n')
}

describe('ChunkQuery', () => {
  describe('Vector', () => {
    const createQuery = () =>
      new ChunkQuery<{ vector: Vector3; dimensionType: DimensionType; id: number }>(
        (point, object) => Vector.equals(point, object.vector),
        (area, object) => area.isAt(object.vector),
        (vector, object, distance) => Vector.distanceCompare(vector, object.vector, distance + 1),
        object => object.dimensionType,
        object => [object.vector, object.vector] as const,
        ChunkQuery.createDimensionTypeChunkStorage(),
      )

    function createSinglePoint(x: number, y: number, z: number, id: number, dimensionType?: DimensionType) {
      return { ...createPoint(x, y, z, dimensionType), id }
    }

    it('should query for single vector', async () => {
      const query = createQuery()

      expect(await query.add(createSinglePoint(1, 1, 1, 0))).toMatchInlineSnapshot(`
        [
          {
            "from": "0 0",
            "key": "0 0",
            "size": 16,
            "to": "15 15",
            "w": {
              "from": "0 0",
              "key": "0 0",
              "size": 64,
              "to": "63 63",
              "w": {
                "from": "0 0",
                "key": "0 0",
                "size": 1,
                "to": "0 0",
                "w": undefined,
              },
            },
          },
        ]
      `)
      await query.add(createSinglePoint(16, 16, 16, 1))
      await query.add(createSinglePoint(17, 17, 17, 2))
      await query.add(createSinglePoint(100, 100, 100, 3))
      await query.add(createSinglePoint(100, 100, 100, 4, 'end'))

      expect(query.getAt(createPoint(1, 1, 1)).map(byId)).toEqual([0])
      expect(query.getAt(createPoint(16, 16, 16)).map(byId)).toEqual([1])
      expect(query.getAt(createPoint(17, 17, 17)).map(byId)).toEqual([2])
      expect(query.getAt(createPoint(18, 18, 18)).map(byId)).toEqual([])
      expect(query.getAt(createPoint(100, 100, 100)).map(byId)).toEqual([3])
      expect(query.getAt(createPoint(100, 100, 100, 'end')).map(byId)).toEqual([4])

      expect(query.getChunksNear(createPoint(15, 15, 15), 5).map(e => e.getSize('overworld', query)))
        .toMatchInlineSnapshot(`
          [
            {
              "chunks16": 1,
              "chunks64": 0,
              "objects": 1,
            },
            {
              "chunks16": 1,
              "chunks64": 0,
              "objects": 2,
            },
          ]
        `)

      expect(query.getNear(createPoint(15, 15, 15), 5).map(byId)).toMatchInlineSnapshot(`
        [
          1,
          2,
        ]
      `)
    })

    it('should handle negative coordinates', async () => {
      const query = createQuery()

      await query.add(createSinglePoint(-16, 0, -16, 10))
      await query.add(createSinglePoint(-1, 0, -1, 11))
      await query.add(createSinglePoint(-32, 0, -32, 12))

      expect(query.getAt(createPoint(-16, 0, -16)).map(byId)).toEqual([10])
      expect(query.getAt(createPoint(-1, 0, -1)).map(byId)).toEqual([11])
      expect(query.getAt(createPoint(-32, 0, -32)).map(byId)).toEqual([12])
      expect(query.getAt(createPoint(-100, 0, -100)).map(byId)).toEqual([])
    })

    it('should inspect api calls for area', async () => {
      const query = createQuery()
      const point = createSinglePoint(1, 1, 1, 10)
      const isObjectAt = vi.spyOn(query, 'isObjectAt')
      const isObjectIn = vi.spyOn(query, 'isObjectIn')
      const isObjectNear = vi.spyOn(query, 'isObjectNear')
      const getObjectEdges = vi.spyOn(query as unknown as { getObjectEdges: VoidFunction }, 'getObjectEdges')
      const getObjectDimension = vi.spyOn(
        query as unknown as { getObjectDimension: VoidFunction },
        'getObjectDimension',
      )
      const getStats = () =>
        Object.entries({
          isObjectAt,
          isObjectIn,
          isObjectNear,
          getObjectEdges,
          getObjectDimension,
        })
          .map(e => {
            const calls = e[1].mock.calls.length
            e[1].mockClear()
            return e[0] + ': ' + calls
          })
          .join('\n')

      await query.add(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectIn: 0
        isObjectNear: 0
        getObjectEdges: 1
        getObjectDimension: 1"
      `)

      expect(query.getAt(createPoint(1, 1, 1)).map(byId)).toEqual([10])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 1
        isObjectIn: 0
        isObjectNear: 0
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      expect(query.getNear(createPoint(2, 2, 2), 5).map(byId)).toEqual([10])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectIn: 0
        isObjectNear: 1
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      query.remove(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectIn: 0
        isObjectNear: 0
        getObjectEdges: 0
        getObjectDimension: 1"
      `)
    })

    it('should remove points correctly', async () => {
      const query = createQuery()

      const pt1 = createSinglePoint(5, 0, 5, 20)
      const pt2 = createSinglePoint(-5, 0, -5, 21)
      await query.add(pt1)
      await query.add(pt2)

      expect(query.getAt(createPoint(5, 0, 5)).map(byId)).toEqual([20])
      expect(query.getAt(createPoint(-5, 0, -5)).map(byId)).toEqual([21])

      query.remove(pt1)
      expect(query.getAt(createPoint(5, 0, 5)).map(byId)).toEqual([])

      query.remove(pt2)
      expect(query.getAt(createPoint(-5, 0, -5)).map(byId)).toEqual([])
    })
  })

  describe('Area', () => {
    const createQuery = () =>
      new ChunkQuery<InstanceType<typeof SphereArea>>(
        (vector, object) => object.isIn({ vector, dimensionType: object.dimensionType }),
        (area, object) => {
          let result = false
          object.forEachVector((vector, isIn) => {
            if (isIn && area.isAt(vector)) {
              result = true
              return STOP_AREA_FOR_EACH_VECTOR
            }
          })

          return result
        },
        (vector, object, distance) => object.isNear({ vector, dimensionType: object.dimensionType }, distance),
        object => object.dimensionType,
        object => {
          const [from, to] = object.edges
          return [Vector.min(from, to), Vector.max(from, to)]
        },
        ChunkQuery.createDimensionTypeChunkStorage(),
      )

    function createSinglePoint(x: number, y: number, z: number, radius: number, dimensionType?: DimensionType) {
      return new SphereArea({ center: { x, y, z }, radius: radius }, dimensionType)
    }

    it('should inspect api calls for area', async () => {
      const query = createQuery()
      const point = createSinglePoint(1, 1, 1, 10)
      const isObjectAt = vi.spyOn(query, 'isObjectAt')
      const isObjectIn = vi.spyOn(query, 'isObjectIn')
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
          isObjectIn,
          isObjectNear,
          pointIsIn,
          pointIsNear,
          getObjectEdges,
          getObjectDimension,
        })
          .map(e => {
            const calls = e[1].mock.calls.length
            e[1].mockClear()
            return e[0] + ': ' + calls
          })
          .join('\n')

      await query.add(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectIn: 0
        isObjectNear: 0
        pointIsIn: 0
        pointIsNear: 0
        getObjectEdges: 1
        getObjectDimension: 1"
      `)

      await query.add(createSinglePoint(1, 1, 3, 11))
      await query.add(createSinglePoint(1, 3, 3, 12))
      await query.add(createSinglePoint(1, 1, 300, 12))
      await query.add(createSinglePoint(1, 1, 100, 12))
      await query.add(createSinglePoint(1, 1, 17, 12))

      expect(query.getAt(createPoint(0, 0, 0)).map(byRadius)).toMatchInlineSnapshot(`
        [
          10,
          11,
          12,
        ]
      `)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 4
        isObjectIn: 0
        isObjectNear: 0
        pointIsIn: 1
        pointIsNear: 1
        getObjectEdges: 5
        getObjectDimension: 5"
      `)

      expect(query.getAt(createPoint(100, 0, 0)).map(byRadius)).toEqual([])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectIn: 0
        isObjectNear: 0
        pointIsIn: 0
        pointIsNear: 0
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      expect(query.getNear(createPoint(15, 15, 15), 7).map(byRadius)).toEqual([])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectIn: 0
        isObjectNear: 5
        pointIsIn: 0
        pointIsNear: 1
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      query.remove(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectIn: 0
        isObjectNear: 0
        pointIsIn: 0
        pointIsNear: 0
        getObjectEdges: 0
        getObjectDimension: 1"
      `)
    })

    it('should query for area', async () => {
      const query = createQuery()
      expect(inspectChunks(query)).toMatchInlineSnapshot(`""`)

      await query.add(createSinglePoint(-1, -1, -1, 3))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "[1 1 1 1]
        [1 1 1 1]
        [1 1 1 1]
        [1 1 1 1]"
      `)

      await query.add(createSinglePoint(1, 1, 1, 2))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "[1 1 1 1]
        [1 1 1 1]
        [1 1 1 1]
        [1 1 1 2]"
      `)
      await query.add(createSinglePoint(16, 16, 16, 3))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "[1 1 1 1]
        [1 1 1 1]
        [1 1 1 1]
        [1 1 1 3 1 1 1]"
      `)

      await query.add(createSinglePoint(17, 17, 17, 4))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "[1 1 1 1]
        [1 1 1 1]
        [1 1 1 1]
        [1 1 1 4 2 2 2]"
      `)

      await query.add(createSinglePoint(100, 100, 100, 5))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "[1 1 1 1]
        [1 1 1 1]
        [1 1 1 1]
        [1 1 1 4 2 2 2]
        [1]"
      `)

      await query.add(createSinglePoint(100, 100, 100, 6, 'end'))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "[1 1 1 1]
        [1 1 1 1]
        [1 1 1 1]
        [1 1 1 4 2 2 2]
        [1]"
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

    it('query.getNear should work same as iteration', async () => {
      const points = [
        createSinglePoint(0, 0, 0, 10),
        createSinglePoint(0, 0, 5, 11),
        createSinglePoint(0, 5, 0, 12),
        createSinglePoint(5, 5, 5, 13),
        createSinglePoint(-5, 0, 0, 14),
      ]
      const neverHitPoint = createSinglePoint(0, 1, 30, 15)
      const spy = vi.spyOn(neverHitPoint, 'isNear')
      points.push(neverHitPoint)

      const point = createPoint(5, 0, 0)
      const iteration = points.filter(e => e.isNear(point, 5))

      expect(iteration.map(byRadius)).toMatchInlineSnapshot(`
        [
          10,
          11,
          12,
          13,
          14,
        ]
      `)

      expect(spy).toHaveBeenCalledTimes(1)

      const query = createQuery()

      await Promise.all(points.map(e => query.add(e)))

      expect(query.getNear(point, 10).map(byRadius)).toMatchInlineSnapshot(`
        [
          10,
          11,
          12,
          13,
          14,
        ]
      `)

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should handle negative coordinates', async () => {
      const query = createQuery()

      await query.add(createSinglePoint(-16, 0, -16, 10))
      await query.add(createSinglePoint(-1, 0, -1, 11))
      await query.add(createSinglePoint(-32, 0, -32, 12))

      expect(query.getAt(createPoint(-16, 0, -16)).map(byRadius)).toEqual([10])
      expect(query.getAt(createPoint(-1, 0, -1)).map(byRadius)).toEqual([11])
      expect(query.getAt(createPoint(-32, 0, -32)).map(byRadius)).toEqual([12])
      expect(query.getAt(createPoint(-100, 0, -100)).map(byRadius)).toEqual([])
    })

    it('should remove areas correctly', async () => {
      const query = createQuery()

      const area1 = createSinglePoint(5, 0, 5, 2)
      const area2 = createSinglePoint(-5, 0, -5, 1)

      await query.add(area1)
      await query.add(area2)

      expect(query.getAt(createPoint(5, 0, 5)).map(byRadius)).toEqual([2])
      expect(query.getAt(createPoint(-5, 0, -5)).map(byRadius)).toEqual([1])

      query.remove(area1)
      expect(query.getAt(createPoint(5, 0, 5)).map(byRadius)).toEqual([])

      query.remove(area2)
      expect(query.getAt(createPoint(-5, 0, -5)).map(byRadius)).toEqual([])
    })
  })

  describe('ChunkArea', () => {
    it('should create area in ++', () => {
      expect(new ChunkArea(0, 0, 16, 'overworld', undefined)).toMatchInlineSnapshot(`
        ChunkArea {
          "center": {
            "x": 7.5,
            "z": 7.5,
          },
          "dimensionType": "overworld",
          "from": {
            "x": 0,
            "z": 0,
          },
          "indexX": 0,
          "indexZ": 0,
          "parent": undefined,
          "size": 16,
          "to": {
            "x": 15,
            "z": 15,
          },
        }
      `)
    })
    it('should create area in --', () => {
      expect(new ChunkArea(-16, -16, 16, 'overworld', undefined)).toMatchInlineSnapshot(`
        ChunkArea {
          "center": {
            "x": -8.5,
            "z": -8.5,
          },
          "dimensionType": "overworld",
          "from": {
            "x": -16,
            "z": -16,
          },
          "indexX": -1,
          "indexZ": -1,
          "parent": undefined,
          "size": 16,
          "to": {
            "x": -1,
            "z": -1,
          },
        }
      `)
    })
  })
})

