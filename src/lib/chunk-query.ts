import { util } from 'lib/util'
import { inspect } from 'lib/utils/inspect'
import { VecXZ } from 'lib/vector'
import { AbstractPoint, toFlooredPoint, VectorInDimension } from './utils/point'

const chunkSize = 16

function getChunkIndexes(x: number, z: number, size = chunkSize) {
  const indexX = Math.floor(x / size)
  const indexZ = Math.floor(z / size)

  return { indexX, indexZ }
}

function getChunkKey(indexX: number, indexZ: number, size = chunkSize) {
  return `${indexX} ${indexZ} ${size}`
}

export class ChunkArea {
  static size = 16

  readonly indexX: number
  readonly indexZ: number

  readonly from: VectorXZ
  readonly to: VectorXZ
  readonly center: VectorXZ

  constructor(
    x: number,
    z: number,
    readonly size: number,
    readonly dimensionType: DimensionType,
    readonly parent: Chunk | undefined,
  ) {
    const { indexX, indexZ } = getChunkIndexes(x, z, size)
    this.indexX = indexX
    this.indexZ = indexZ

    this.from = { x: this.indexX * size, z: this.indexZ * size }
    this.to = { x: this.from.x + size - 1, z: this.from.z + size - 1 }
    this.center = VecXZ.center(this.from, this.to)
  }

  isAt(point: Vector3): boolean {
    return VecXZ.isBetween(this.from, this.to, point)
  }

  isNear(point: Vector3, distance: number): boolean {
    const { from, to } = this
    return VecXZ.isBetween(
      VecXZ.add(from, { x: -distance, z: -distance }),
      VecXZ.add(to, { x: distance, z: distance }),
      point,
    )
  }

  protected getKey(x = this.indexX, z = this.indexZ, size = this.size) {
    return `${x} ${z} ${size}`
  }

  toJSON(): object {
    return {
      from: `${this.from.x} ${this.from.z}`,
      to: `${this.to.x} ${this.to.z}`,
      key: this.getKey(),
      size: this.size,
      w: this.parent?.toJSON(),
    }
  }
}

class QueryContext {
  visited = new WeakSet()
  visitedChunks = new WeakSet<Chunk>()
}

export abstract class Chunk extends ChunkArea {
  protected children: typeof Chunk | undefined

  abstract getAt(point: VectorInDimension, query: ChunkQuery, ctx: QueryContext): object[]

  abstract getNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx: QueryContext): object[]

  abstract add(object: object, query: ChunkQuery, from?: Vector3, to?: Vector3, dimensionType?: DimensionType): Chunk[]

  abstract remove(object: object, query: ChunkQuery, dimensionType?: DimensionType): MaybePromise<void>

  abstract storageSize(
    dimensionType: DimensionType,
    query: ChunkQuery,
  ): { chunks64: number; chunks16: number; objects: number }
}

interface ChunkCreator {
  size: number
  new (x: number, z: number, size: number, dimensionType: DimensionType, parent: Chunk | undefined): Chunk
}

export class Chunk16 extends Chunk {
  static size = 16

  storage = new Map<ChunkQuery, Set<object>>()

  protected getOrCreateIteratorFor(query: ChunkQuery) {
    const objects = this.storage.get(query)
    if (!objects?.size) return []
    return [...objects]
  }

  getAt(point: VectorInDimension, query: ChunkQuery, ctx: QueryContext): object[] {
    return this.getOrCreateIteratorFor(query).filter(object => {
      if (ctx.visited.has(object)) return false
      ctx.visited.add(object)

      return query.isObjectAt(point.vector, object)
    })
  }

  getNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx: QueryContext): object[] {
    return this.getOrCreateIteratorFor(query).filter(object => {
      if (ctx.visited.has(object)) return false
      ctx.visited.add(object)

      return query.isObjectNear(point.vector, object, distance)
    })
  }

  add(object: object, query: ChunkQuery): Chunk[] {
    let objects = this.storage.get(query)
    if (!objects) {
      objects = new Set()
      this.storage.set(query, objects)
    }

    objects.add(object)

    return [this]
  }

  remove(object: object, query: ChunkQuery): void {
    this.storage.get(query)?.delete(object)
  }

  storageSize(_: undefined | DimensionType, query: ChunkQuery) {
    return { chunks64: 0, chunks16: 1, objects: this.storage.get(query)?.size ?? 0 }
  }
}

export class Chunk64 extends Chunk {
  static size = 64

  static iteration = 0

  static createDimensionTypeChunkStorage() {
    return new Map<DimensionType, Chunk[]>()
  }

  protected children: ChunkCreator = Chunk16

  protected chunks = Chunk64.createDimensionTypeChunkStorage()

  protected getChunks(dimensionType: DimensionType): Chunk[] {
    let chunks = this.chunks.get(dimensionType)
    if (!chunks) this.chunks.set(dimensionType, (chunks = []))
    return chunks
  }

  protected *iterate(dimensionType: DimensionType, ctx: QueryContext) {
    for (const chunk of this.getChunks(dimensionType)) {
      if (ctx.visitedChunks.has(chunk)) continue
      ctx.visitedChunks.add(chunk)

      yield chunk
    }
  }

  getAt(point: VectorInDimension, query: ChunkQuery, ctx = new QueryContext()): object[] {
    const result: object[] = []
    for (const chunk of this.iterate(point.dimensionType, ctx)) {
      if (chunk.isAt(point.vector)) result.push(...chunk.getAt(point, query, ctx))
    }
    return result
  }

  getNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx = new QueryContext()): object[] {
    const result: object[] = []
    for (const chunk of this.iterate(point.dimensionType, ctx)) {
      if (chunk.isNear(point.vector, distance)) result.push(...chunk.getNear(point, distance, query, ctx))
    }
    return result
  }

  getChunksAt(point: VectorInDimension, query: ChunkQuery, ctx = new QueryContext()): Chunk[] {
    const result = new Set<Chunk>()
    for (const chunk of this.iterate(point.dimensionType, ctx)) {
      if (!chunk.isAt(point.vector)) continue

      if (chunk instanceof Chunk64) for (const c of chunk.getChunksAt(point, query, ctx)) result.add(c)
      else result.add(chunk)
    }
    return [...result]
  }

  getChunksNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx = new QueryContext()): Chunk[] {
    const result = new Set<Chunk>()
    for (const chunk of this.iterate(point.dimensionType, ctx)) {
      if (!chunk.isNear(point.vector, distance)) continue

      if (chunk instanceof Chunk64) for (const c of chunk.getChunksNear(point, distance, query, ctx)) result.add(c)
      else result.add(chunk)
    }
    return [...result]
  }

  storageSize(
    dimensionType: DimensionType,
    query: ChunkQuery,
  ): { chunks64: number; chunks16: number; objects: number } {
    let chunks64 = 1
    let chunks16 = 0
    let objects = 0
    for (const chunk of this.getChunks(dimensionType)) {
      const size = chunk.storageSize(dimensionType, query)
      chunks16 += size.chunks16
      chunks64 += size.chunks64
      objects += size.objects
    }

    return { objects, chunks64, chunks16 }
  }

  add(object: object, query: ChunkQuery, from: Vector3, to: Vector3, dimensionType: DimensionType): Chunk[] {
    const step = this.children.size
    const addedTo: Chunk[] = []
    const visited = new Set<Chunk | undefined>()
    const area = new ChunkArea(from.x, from.z, this.children.size, dimensionType, undefined)
    const chunks = this.getChunks(dimensionType)
    const createdChunks = query.getChunksCache(dimensionType)

    const isQuery = this instanceof ChunkQuery

    for (let x = area.from.x; x <= to.x; x += step) {
      for (let z = area.from.z; z <= to.z; z += step) {
        if (!isQuery && !this.isAt({ x, z, y: 0 })) continue

        const { indexX, indexZ } = getChunkIndexes(x, z)
        const key = getChunkKey(indexX, indexZ, step)
        const existing = createdChunks.get(key)

        if (visited.has(existing)) continue // Skip already visited chunks to not add twice

        let chunk: Chunk | undefined
        if (existing) chunk = existing
        else {
          chunk = new this.children(x, z, this.children.size, dimensionType, this)
          createdChunks.set(key, chunk)
        }

        visited.add(chunk)
        // We created a new chunk and should store it
        if (!chunks.includes(chunk)) chunks.push(chunk)

        addedTo.push(...chunk.add(object, query, from, to, dimensionType))
      }
    }

    return addedTo
  }

  remove(object: object, query: ChunkQuery, dimensionType: DimensionType) {
    this.getChunks(dimensionType).forEach(chunk => chunk.remove(object, query, dimensionType))
  }
}

type ChunksCache = Map<string, Chunk>

export class ChunkQuery<T extends object = any> extends Chunk64 {
  static chunks = Chunk64.createDimensionTypeChunkStorage()

  private chunksCache = new Map<DimensionType, ChunksCache>()

  getChunksCache(dimensionType: DimensionType): ChunksCache {
    let cache = this.chunksCache.get(dimensionType)
    if (!cache) this.chunksCache.set(dimensionType, (cache = new Map() as ChunksCache))

    return cache
  }

  static getChunks(query: Chunk64) {
    return (query as ChunkQuery).chunks
  }

  protected children = Chunk64

  constructor(
    readonly isObjectAt: (point: Vector3, object: T) => boolean,
    readonly isObjectNear: (point: Vector3, object: T, distance: number) => boolean,
    protected readonly getObjectDimension: (object: T) => DimensionType,
    protected readonly getObjectEdges: (object: T) => [from: Vector3, to: Vector3],
    protected chunks = Chunk64.createDimensionTypeChunkStorage(),
  ) {
    super(0, 0, 1, 'overworld', undefined)
  }

  private getChunkAt(x: number, z: number, cache: ChunksCache) {
    const { indexX, indexZ } = getChunkIndexes(x, z)
    const key = getChunkKey(indexX, indexZ)
    return cache.get(key)
  }

  getAt(point: AbstractPoint): T[] {
    point = toFlooredPoint(point)

    const chunk = this.getChunkAt(point.vector.x, point.vector.z, this.getChunksCache(point.dimensionType))

    if (!chunk) return []
    return chunk.getAt(point, this, new QueryContext()) as T[]
  }

  getNear(point: AbstractPoint, distance: number): T[] {
    point = toFlooredPoint(point)

    const ctx = new QueryContext()
    const result: object[] = []
    const cache = this.getChunksCache(point.dimensionType)
    const [from, to] = VecXZ.around(point.vector, distance + chunkSize)
    for (let x = from.x; x <= to.x; x += chunkSize) {
      for (let z = from.z; z <= to.z; z += chunkSize) {
        const chunk = this.getChunkAt(x, z, cache)
        if (!chunk) continue

        result.push(...chunk.getNear(point, distance, this, ctx))
      }
    }

    return result as T[]
  }

  getChunksNear(point: AbstractPoint, distance: number): Chunk[] {
    return super.getChunksNear(toFlooredPoint(point), distance, this)
  }

  add(object: T): Chunk[] {
    const bench = util.benchmark('ChunkQuery add', 'chunkQuery')
    const result = super.add(object, this, ...this.getObjectEdges(object), this.getObjectDimension(object))
    bench()
    if (!result.length) throw new Error(`Unable to add point ${inspect(object).replace(/§./g, '')}`)
    return result
  }

  remove(object: T) {
    return super.remove(object, this, this.getObjectDimension(object))
  }

  storageSize(dimensionType: DimensionType = 'overworld') {
    return super.storageSize(dimensionType, this)
  }
}

function getOrCreate<K, V>(map: Map<K, V>, key: K, create: (key: K) => V): V {
  let value = map.get(key)
  if (typeof value === 'undefined') map.set(key, (value = create(key)))
  return value
}
