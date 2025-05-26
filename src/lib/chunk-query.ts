import { system } from '@minecraft/server'
import { AbstractPoint, toPoint, VectorInDimension } from 'lib/game-utils'
import { util } from 'lib/util'
import { inspect } from 'lib/utils/inspect'
import { VecXZ } from 'lib/vector'

let i = 0

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
    this.indexX = Math.floor(x / size)
    this.indexZ = Math.floor(z / size)

    i++
    if (i > 1000 && i < 1020) console.log('chunk created', x, z, this.indexX, this.indexZ)

    this.from = { x: this.indexX * size, z: this.indexZ * size }
    this.to = { x: this.from.x + size - 1, z: this.from.z + size - 1 }
    this.center = VecXZ.center(this.from, this.to)
  }

  isAt(point: Vector3): boolean {
    return VecXZ.between(this.from, this.to, point)
  }

  isNear(point: Vector3, distance: number): boolean {
    const { from, to } = this
    // return VecXZ.distanceCompare(point, this.center, distance + this.size)
    return VecXZ.between(
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

  abstract add(
    object: object,
    query: ChunkQuery,
    from?: Vector3,
    to?: Vector3,
    dimensionType?: DimensionType,
    ctx?: { iteration: number },
  ): MaybePromise<Chunk[]>

  abstract remove(object: object, query: ChunkQuery, dimensionType?: DimensionType): MaybePromise<void>

  abstract getSize(
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

      if (query.isObjectAt(point.vector, object)) {
        ctx.visited.add(object)
        return true
      }
    })
  }

  getNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx: QueryContext): object[] {
    return this.getOrCreateIteratorFor(query).filter(object => {
      if (ctx.visited.has(object)) return false

      if (query.isObjectNear(point.vector, object, distance)) {
        ctx.visited.add(object)
        return true
      }
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

  getSize(_: undefined | DimensionType, query: ChunkQuery) {
    return { chunks64: 0, chunks16: 1, objects: this.storage.get(query)?.size ?? 0 }
  }
}

let l = false

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

  getAt(point: VectorInDimension, query: ChunkQuery, ctx = new QueryContext()): object[] {
    const result = []
    for (const chunk of this.getChunks(point.dimensionType)) {
      if (ctx.visitedChunks.has(chunk) || !chunk.isAt(point.vector)) continue
      ctx.visitedChunks.add(chunk)

      result.push(...chunk.getAt(point, query, ctx))
    }
    return result
  }

  getNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx = new QueryContext()): object[] {
    const result = new Set<object>()
    for (const chunk of this.getChunks(point.dimensionType)) {
      const hh = ctx.visitedChunks.has(chunk)
      if (hh) console.log('asfkdoakdfoaksfos')
      if (hh || !chunk.isNear(point.vector, distance)) continue
      ctx.visitedChunks.add(chunk)

      for (const object of chunk.getNear(point, distance, query, ctx)) result.add(object)
    }
    return [...result]
  }

  getChunksNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx = new QueryContext()): Chunk[] {
    const result = new Set<Chunk>()
    for (const chunk of this.getChunks(point.dimensionType)) {
      const hh = ctx.visitedChunks.has(chunk)
      if (hh) console.log('asfkdoakdfoaksfos')
      if (hh || !chunk.isNear(point.vector, distance)) continue
      ctx.visitedChunks.add(chunk)

      if (chunk instanceof Chunk64) {
        for (const c of chunk.getChunksNear(point, distance, query)) result.add(c)
      } else {
        result.add(chunk)
      }
    }
    return [...result]
  }

  getSize(dimensionType: DimensionType, query: ChunkQuery): { chunks64: number; chunks16: number; objects: number } {
    let chunks64 = 1
    let chunks16 = 0
    let objects = 0
    for (const chunk of this.getChunks(dimensionType)) {
      const size = chunk.getSize(dimensionType, query)
      chunks16 += size.chunks16
      chunks64 += size.chunks64
      objects += size.objects
    }

    return { objects, chunks64, chunks16 }
  }

  async add(
    object: object,
    query: ChunkQuery,
    from: Vector3,
    to: Vector3,
    dimensionType: DimensionType,
    ctx: { iteration: number } = { iteration: 0 },
  ): Promise<Chunk[]> {
    const step = this.children.size
    const addedTo: MaybePromise<Chunk[]>[] = []
    const visited = new Set<Chunk | undefined>()
    const area = new ChunkArea(from.x, from.z, this.children.size, dimensionType, undefined)
    const chunks = this.getChunks(dimensionType)
    const createdChunks = query.getChunksCache(dimensionType)

    await new Promise<void>(resolve => {
      system.runJob(
        function* ChunkAdd(this: Chunk64) {
          for (let x = area.from.x; x <= to.x; x += step) {
            for (let z = area.from.z; z <= to.z; z += step) {
              ctx.iteration++
              if (ctx.iteration % 10 === 0) yield

              if (this.size > 1) {
                if (!this.isAt({ x, z, y: 0 })) continue
              }

              const key = this.getKey(Math.floor(x / step), Math.floor(z / step), step)
              const existing = createdChunks.get(key)

              if (visited.has(existing)) continue // Skip already visited chunks to not add twice

              let chunk: Chunk | undefined
              if (existing) chunk = existing
              else {
                chunk = new this.children(x, z, this.children.size, dimensionType, this)
                createdChunks.set((chunk as Chunk64).getKey(), chunk)
              }

              visited.add(chunk)
              if (!chunks.includes(chunk)) {
                const double = query.usedChunksCache.has(chunk)
                query.usedChunksCache.add(chunk)
                if (double && !l) {
                  l = true
                  console.error('Double!', chunk, this)
                }

                // if (!double) {
                chunks.push(chunk)
                // }
              } // We created a new chunk and should store it

              addedTo.push(chunk.add(object, query, from, to, dimensionType, ctx))
            }
          }
          resolve()
        }.call(this),
      )
    })

    return (await Promise.all(addedTo)).flat()
  }

  remove(object: object, query: ChunkQuery, dimensionType: DimensionType) {
    this.getChunks(dimensionType).forEach(chunk => chunk.remove(object, query, dimensionType))
  }
}

export class ChunkQuery<T extends object = any> extends Chunk64 {
  static chunks = Chunk64.createDimensionTypeChunkStorage()

  chunksCache = new Map<DimensionType, Map<string, Chunk>>()

  getChunksCache(dimensionType: DimensionType): Map<string, Chunk> {
    let cache = this.chunksCache.get(dimensionType)
    if (!cache) this.chunksCache.set(dimensionType, (cache = new Map<string, Chunk>()))

    return cache
  }

  usedChunksCache = new Set<Chunk>()

  static getChunks(query: Chunk64) {
    return (query as ChunkQuery).chunks
  }

  protected children = Chunk64

  constructor(
    readonly isObjectAt: (point: Vector3, object: T) => boolean,
    readonly isObjectIn: (area: ChunkArea, object: T) => MaybePromise<boolean>,
    readonly isObjectNear: (point: Vector3, object: T, distance: number) => boolean,
    protected readonly getObjectDimension: (object: T) => DimensionType,
    protected readonly getObjectEdges: (object: T) => [from: Vector3, to: Vector3],
    protected chunks = Chunk64.createDimensionTypeChunkStorage(),
  ) {
    super(0, 0, 1, 'overworld', undefined)
  }

  getAt(point: AbstractPoint): T[] {
    return super.getAt(toPoint(point), this) as T[]
  }

  getNear(point: AbstractPoint, distance: number): T[] {
    return super.getNear(toPoint(point), distance, this) as T[]
  }

  getChunksNear(point: AbstractPoint, distance: number): Chunk[] {
    return super.getChunksNear(toPoint(point), distance, this)
  }

  async add(object: T): Promise<Chunk[]> {
    const bench = util.benchmark('ChunkQuery add', 'chunkQuery')
    const result = await super.add(object, this, ...this.getObjectEdges(object), this.getObjectDimension(object))
    bench()
    if (!result.length) throw new Error(`Unable to add point ${inspect(object).replace(/§./g, '')}`)
    return result
  }

  remove(object: T) {
    return super.remove(object, this, this.getObjectDimension(object))
  }

  getSize(dimensionType: DimensionType = 'overworld') {
    return super.getSize(dimensionType, this)
  }
}
