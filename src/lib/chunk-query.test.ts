import { createPoint } from 'lib/game-utils'
import { Vector } from 'lib/vector'
import { Chunk64, ChunkArea, ChunkQuery } from './chunk-query'
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
  let results: (VectorXZ & { v: string })[] = []

  const chunksFrom = (c: typeof ChunkQuery | Chunk64) => ChunkQuery.getChunks(query)?.get(dimensionType) ?? []

  let fromX
  let fromZ
  let toX
  let toZ

  for (const e of chunksFrom(ChunkQuery)) {
    if (!(e instanceof Chunk64)) return

    // @ts-expect-error aaaaaaa
    const size = e.children.size
    for (let x = e.from.x; x <= e.to.x; x += size) {
      for (let z = e.from.z; z <= e.to.z; z += size) {
        const chunk = e.getChunksAt({ vector: { x, z, y: 0 }, dimensionType }, query)[0]

        let result = ''
        if (chunk) result = '' + chunk.storageSize(dimensionType, query).objects
        else result = '*'

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
    }
  }

  let result = `x: ${fromX}  z: ${fromZ}\n\n`
  if (typeof fromX === 'number' && typeof toX === 'number' && typeof toZ === 'number' && typeof fromZ === 'number') {
    for (let x = fromX; x <= toX; x += 16) {
      for (let z = fromZ; z <= toZ; z += 16) {
        const point = results.find(e => e.x === x && e.z === z)
        const v = point ? point.v : '_'
        result += ' ' + v.padStart(2, ' ')
      }
      result += '\n'
    }
  }

  result += `\nx: ${toX}  z: ${toZ}\n`

  return result
}

describe('ChunkQuery', () => {
  describe('Vector', () => {
    const createQuery = () =>
      new ChunkQuery<{ vector: Vector3; dimensionType: DimensionType; id: number }>(
        (point, object) => Vector.equals(point, object.vector),
        (vector, object, distance) => Vector.distanceCompare(vector, object.vector, distance + 1),
        object => object.dimensionType,
        object => [object.vector, object.vector] as const,
        ChunkQuery.createDimensionTypeChunkStorage(),
      )

    function createSinglePoint(x: number, y: number, z: number, id: number, dimensionType?: DimensionType) {
      return { ...createPoint(x, y, z, dimensionType), id }
    }

    it('should query for single vector', () => {
      const query = createQuery()

      query.add(createSinglePoint(16, 16, 16, 1))
      query.add(createSinglePoint(17, 17, 17, 2))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: 0  z: 0

          *  *  *  *
          *  2  *  *
          *  *  *  *
          *  *  *  *

        x: 48  z: 48
        "
      `)
      query.add(createSinglePoint(100, 100, 100, 3))

      query.add(createSinglePoint(100, 100, 100, 4, 'end'))

      expect(query.getAt(createPoint(1, 1, 1)).map(byId)).toEqual([])
      expect(query.getAt(createPoint(16, 16, 16)).map(byId)).toEqual([1])
      expect(query.getAt(createPoint(17, 17, 17)).map(byId)).toEqual([2])
      expect(query.getAt(createPoint(18, 18, 18)).map(byId)).toEqual([])
      expect(query.getAt(createPoint(100, 100, 100)).map(byId)).toEqual([3])
      expect(query.getAt(createPoint(100, 100, 100, 'end')).map(byId)).toEqual([4])

      expect(query.getChunksNear(createPoint(15, 15, 15), 5)).toMatchInlineSnapshot(`
        [
          {
            "from": "16 16",
            "key": "1 1 16",
            "size": 16,
            "to": "31 31",
            "w": {
              "from": "0 0",
              "key": "0 0 64",
              "size": 64,
              "to": "63 63",
              "w": {
                "from": "0 0",
                "key": "0 0 1",
                "size": 1,
                "to": "0 0",
                "w": undefined,
              },
            },
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

    it('should handle negative coordinates', () => {
      const query = createQuery()

      query.add(createSinglePoint(-16, 0, -16, 10))
      query.add(createSinglePoint(-1, 0, -1, 11))
      query.add(createSinglePoint(-32, 0, -32, 12))

      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *
          *  *  *  *
          *  *  1  *
          *  *  *  2

        x: -16  z: -16
        "
      `)

      expect(query.getAt(createPoint(-16, 0, -16)).map(byId)).toEqual([10])
      expect(query.getAt(createPoint(-1, 0, -1)).map(byId)).toEqual([11])
      expect(query.getAt(createPoint(-32, 0, -32)).map(byId)).toEqual([12])
      expect(query.getAt(createPoint(-100, 0, -100)).map(byId)).toEqual([])
    })

    it('should inspect api calls for area', () => {
      const query = createQuery()
      const point = createSinglePoint(1, 1, 1, 10)
      const isObjectAt = vi.spyOn(query, 'isObjectAt')
      const isObjectNear = vi.spyOn(query, 'isObjectNear')
      const getObjectEdges = vi.spyOn(query as unknown as { getObjectEdges: VoidFunction }, 'getObjectEdges')
      const getObjectDimension = vi.spyOn(
        query as unknown as { getObjectDimension: VoidFunction },
        'getObjectDimension',
      )
      const getStats = () =>
        Object.entries({
          isObjectAt,
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

      query.add(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 0
        getObjectEdges: 1
        getObjectDimension: 1"
      `)

      expect(query.getAt(createPoint(1, 1, 1)).map(byId)).toEqual([10])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 1
        isObjectNear: 0
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      expect(query.getNear(createPoint(2, 2, 2), 5).map(byId)).toEqual([10])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 1
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      query.remove(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 0
        getObjectEdges: 0
        getObjectDimension: 1"
      `)
    })

    it('should remove points correctly', () => {
      const query = createQuery()

      const pt1 = createSinglePoint(5, 0, 5, 20)
      const pt2 = createSinglePoint(-5, 0, -5, 21)
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
    const createQuery = () =>
      new ChunkQuery<InstanceType<typeof SphereArea>>(
        (vector, object) => object.isIn({ vector, dimensionType: object.dimensionType }),
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

    it('should inspect api calls for area', () => {
      const query = createQuery()
      const point = createSinglePoint(1, 1, 1, 10)
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
          .map(e => {
            const calls = e[1].mock.calls.length
            e[1].mockClear()
            return e[0] + ': ' + calls
          })
          .join('\n')

      query.add(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 0
        pointIsIn: 0
        pointIsNear: 0
        getObjectEdges: 1
        getObjectDimension: 1"
      `)

      query.add(createSinglePoint(1, 1, 3, 11))
      query.add(createSinglePoint(1, 3, 3, 12))
      query.add(createSinglePoint(1, 1, 300, 12))
      query.add(createSinglePoint(1, 1, 100, 12))
      query.add(createSinglePoint(1, 1, 17, 12))
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 0
        pointIsIn: 0
        pointIsNear: 0
        getObjectEdges: 5
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
        isObjectNear: 0
        pointIsIn: 1
        pointIsNear: 1
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      expect(query.getAt(createPoint(100, 0, 0)).map(byRadius)).toEqual([])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 0
        pointIsIn: 0
        pointIsNear: 0
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      expect(query.getNear(createPoint(15, 15, 15), 7).map(byRadius)).toEqual([])
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 4
        pointIsIn: 0
        pointIsNear: 1
        getObjectEdges: 0
        getObjectDimension: 0"
      `)

      query.remove(point)
      expect(getStats()).toMatchInlineSnapshot(`
        "isObjectAt: 0
        isObjectNear: 0
        pointIsIn: 0
        pointIsNear: 0
        getObjectEdges: 0
        getObjectDimension: 1"
      `)
    })

    it('should add to the area', () => {
      const query = createQuery()

      expect(query.add(createSinglePoint(0, 0, 0, 36)).length).toMatchInlineSnapshot(`36`)
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *
          *  1  1  1  1  1  1  *
          *  1  1  1  1  1  1  *
          *  1  1  1  1  1  1  *
          *  1  1  1  1  1  1  *
          *  1  1  1  1  1  1  *
          *  1  1  1  1  1  1  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)
      expect(query.storageSize()).toMatchInlineSnapshot(`
        {
          "chunks16": 36,
          "chunks64": 5,
          "objects": 36,
        }
      `)

      expect(query.add(createSinglePoint(0, 0, 100, 8)).length).toMatchInlineSnapshot(`4`)
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *  *  *  *  *
          *  1  1  1  1  1  1  *  *  *  *  *
          *  1  1  1  1  1  1  *  *  *  *  *
          *  1  1  1  1  1  1  *  *  1  1  *
          *  1  1  1  1  1  1  *  *  1  1  *
          *  1  1  1  1  1  1  *  *  *  *  *
          *  1  1  1  1  1  1  *  *  *  *  *
          *  *  *  *  *  *  *  *  *  *  *  *

        x: 48  z: 112
        "
      `)
    })

    it('should query for area', () => {
      const query = createQuery()
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: undefined  z: undefined


        x: undefined  z: undefined
        "
      `)

      query.add(createSinglePoint(-1, -1, -1, 3))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  1  1  *  *  *
          *  *  *  1  1  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)

      query.add(createSinglePoint(1, 1, 1, 2))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  1  1  *  *  *
          *  *  *  1  2  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)
      query.add(createSinglePoint(16, 16, 16, 3))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  1  1  *  *  *
          *  *  *  1  3  1  *  *
          *  *  *  *  1  1  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)

      query.add(createSinglePoint(17, 17, 17, 4))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  1  1  *  *  *
          *  *  *  1  4  2  *  *
          *  *  *  *  2  2  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)

      query.add(createSinglePoint(100, 100, 100, 5))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  1  1  *  *  *  _  _  _  _
          *  *  *  1  4  2  *  *  _  _  _  _
          *  *  *  *  2  2  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          _  _  _  _  _  _  _  _  *  *  *  *
          _  _  _  _  _  _  _  _  *  *  *  *
          _  _  _  _  _  _  _  _  *  *  1  *
          _  _  _  _  _  _  _  _  *  *  *  *

        x: 112  z: 112
        "
      `)

      query.add(createSinglePoint(100, 100, 100, 6, 'end'))
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  1  1  *  *  *  _  _  _  _
          *  *  *  1  4  2  *  *  _  _  _  _
          *  *  *  *  2  2  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          *  *  *  *  *  *  *  *  _  _  _  _
          _  _  _  _  _  _  _  _  *  *  *  *
          _  _  _  _  _  _  _  _  *  *  *  *
          _  _  _  _  _  _  _  _  *  *  1  *
          _  _  _  _  _  _  _  _  *  *  *  *

        x: 112  z: 112
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

      points.forEach(e => query.add(e))

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

    it('should handle negative coordinates', () => {
      const query = createQuery()

      query.add(createSinglePoint(-16, 0, -16, 10))
      query.add(createSinglePoint(-1, 0, -1, 11))
      query.add(createSinglePoint(-32, 0, -32, 12))

      expect(query.getAt(createPoint(-16, 0, -16)).map(byRadius)).toEqual([10])
      expect(query.getAt(createPoint(-1, 0, -1)).map(byRadius)).toEqual([11])
      expect(query.getAt(createPoint(-32, 0, -32)).map(byRadius)).toEqual([12])
      expect(query.getAt(createPoint(-100, 0, -100)).map(byRadius)).toEqual([])
    })

    it('should remove areas correctly', () => {
      const query = createQuery()

      const area1 = createSinglePoint(5, 0, 5, 2)
      const area2 = createSinglePoint(-5, 0, -35, 6)

      query.add(area1)
      query.add(area2)

      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  _  _  _  _
          *  *  *  *  _  _  _  _
          *  *  *  *  _  _  _  _
          *  1  1  *  _  _  _  _
          *  1  1  *  1  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)

      expect(query.getAt(createPoint(5, 0, 5)).map(byRadius)).toEqual([2])
      expect(query.getAt(createPoint(-5, 0, -35)).map(byRadius)).toEqual([6])

      query.remove(area1)
      expect(query.getAt(createPoint(5, 0, 5)).map(byRadius)).toEqual([])
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  _  _  _  _
          *  *  *  *  _  _  _  _
          *  *  *  *  _  _  _  _
          *  1  1  *  _  _  _  _
          *  1  1  *  0  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)

      query.remove(area2)
      expect(query.getAt(createPoint(-5, 0, -35)).map(byRadius)).toEqual([])
      expect(inspectChunks(query)).toMatchInlineSnapshot(`
        "x: -64  z: -64

          *  *  *  *  _  _  _  _
          *  *  *  *  _  _  _  _
          *  *  *  *  _  _  _  _
          *  0  0  *  _  _  _  _
          *  0  0  *  0  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *
          *  *  *  *  *  *  *  *

        x: 48  z: 48
        "
      `)
    })
  })

  describe('ChunkArea', () => {
    it('should create area in ++', () => {
      expect(new ChunkArea(0, 0, 16, 'overworld', undefined)).toMatchInlineSnapshot(`
        {
          "from": "0 0",
          "key": "0 0 16",
          "size": 16,
          "to": "15 15",
          "w": undefined,
        }
      `)
    })
    it('should create area in --', () => {
      expect(new ChunkArea(-16, -16, 16, 'overworld', undefined)).toMatchInlineSnapshot(`
        {
          "from": "-16 -16",
          "key": "-1 -1 16",
          "size": 16,
          "to": "-1 -1",
          "w": undefined,
        }
      `)
    })

    it('should create area in --', () => {
      expect(new ChunkArea(0, 1211, 16, 'overworld', undefined)).toMatchInlineSnapshot(`
        {
          "from": "0 1200",
          "key": "0 75 16",
          "size": 16,
          "to": "15 1215",
          "w": undefined,
        }
      `)
    })
  })
})

