import { util } from 'lib/util'
import { inspect } from 'lib/utils/inspect'
import { VecXZ } from 'lib/vector'
import { AbstractPoint, toPoint, VectorInDimension } from './utils/point'

export class ChunkArea {
  static size = 16

  static getIndexes(x: number, z: number) {
    const indexX = Math.floor(x / this.size)
    const indexZ = Math.floor(z / this.size)

    return { indexX, indexZ }
  }

  static getKey(indexX: number, indexZ: number) {
    return `${indexX} ${indexZ} ${this.size}`
  }

  static getFrom(indexX: number, indexZ: number) {
    return { x: indexX * this.size, z: indexZ * this.size }
  }

  readonly indexX: number
  readonly indexZ: number

  readonly from: VectorXZ
  readonly to: VectorXZ
  readonly center: VectorXZ

  constructor(
    x: number,
    z: number,
    readonly dimensionType: DimensionType,
  ) {
    const { indexX, indexZ } = ChunkArea.getIndexes(x, z)
    this.indexX = indexX
    this.indexZ = indexZ

    this.from = ChunkArea.getFrom(indexX, indexZ)
    this.to = { x: this.from.x + ChunkArea.size - 1, z: this.from.z + ChunkArea.size - 1 }
    this.center = VecXZ.center(this.from, this.to)
  }

  toJSON(): object {
    return {
      from: `${this.from.x} ${this.from.z}`,
      to: `${this.to.x} ${this.to.z}`,
      key: ChunkArea.getKey(this.indexX, this.indexZ),
    }
  }
}

class QueryContext {
  visited = new WeakSet()
}

export class Chunk extends ChunkArea {
  protected storage = new Set<object>()

  getAt(point: VectorInDimension, query: ChunkQuery, ctx: QueryContext): object[] {
    return [...this.storage].filter(object => {
      if (ctx.visited.has(object)) return false
      ctx.visited.add(object)

      return query.isObjectAt(point.location, object)
    })
  }

  getNear(point: VectorInDimension, distance: number, query: ChunkQuery, ctx: QueryContext): object[] {
    return [...this.storage].filter(object => {
      if (ctx.visited.has(object)) return false
      ctx.visited.add(object)

      return query.isObjectNear(point.location, object, distance)
    })
  }

  add(object: object) {
    this.storage.add(object)

    return this
  }

  remove(object: object): void {
    this.storage.delete(object)
  }

  isEmpty() {
    return this.storage.size === 0
  }

  storageSize() {
    return this.storage.size
  }
}

type ChunksStorage = Map<string, Chunk>

export class ChunkQuery<T extends object = any> {
  constructor(
    readonly isObjectAt: (point: Vector3, object: T) => boolean,
    readonly isObjectNear: (point: Vector3, object: T, distance: number) => boolean,
    readonly isObjectIn: (chunk: Chunk, object: T) => boolean,
    protected readonly getObjectDimension: (object: T) => DimensionType,
    protected readonly getObjectEdges: (object: T) => [from: Vector3, to: Vector3],
  ) {}

  private storage = new Map<DimensionType, ChunksStorage>()

  getStorage(dimensionType: DimensionType): ChunksStorage {
    let cache = this.storage.get(dimensionType)
    if (!cache) this.storage.set(dimensionType, (cache = new Map() as ChunksStorage))

    return cache
  }

  private getChunkKey(x: number, z: number) {
    const { indexX, indexZ } = ChunkArea.getIndexes(x, z)
    return ChunkArea.getKey(indexX, indexZ)
  }

  getAt(point: AbstractPoint): T[] {
    point = toPoint(point)

    const key = this.getChunkKey(point.location.x, point.location.z)
    const chunk = this.getStorage(point.dimensionType).get(key)

    if (!chunk) return []
    return chunk.getAt(point, this, new QueryContext()) as T[]
  }

  getNear(point: AbstractPoint, distance: number): T[] {
    point = toPoint(point)

    const ctx = new QueryContext()
    const result: object[] = []
    for (const chunk of this.getChunksNear(point, distance)) {
      result.push(...chunk.getNear(point, distance, this, ctx))
    }

    return result as T[]
  }

  getChunksNear(point: VectorInDimension, distance: number) {
    const result: Chunk[] = []
    const chunks = this.getStorage(point.dimensionType)
    const [from, to] = VecXZ.around(point.location, distance + ChunkArea.size)
    for (let x = from.x; x <= to.x; x += ChunkArea.size) {
      for (let z = from.z; z <= to.z; z += ChunkArea.size) {
        if (!VecXZ.isInsideRadius(point.location, { x, z }, distance + ChunkArea.size)) continue
        const key = this.getChunkKey(x, z)
        const chunk = chunks.get(key)
        if (chunk) result.push(chunk)
      }
    }

    return result
  }

  add(object: T): Chunk[] {
    const bench = util.benchmark('ChunkQuery add', 'chunkQuery')
    const [from, to] = this.getObjectEdges(object)
    const dimensionType = this.getObjectDimension(object)
    const result: Chunk[] = []
    const visited = new Set<Chunk | undefined>()
    const chunks = this.getStorage(dimensionType)
    const fromIndexes = ChunkArea.getIndexes(from.x, from.z)
    const area = ChunkArea.getFrom(fromIndexes.indexX, fromIndexes.indexZ)

    for (let x = area.x; x <= to.x; x += ChunkArea.size) {
      for (let z = area.z; z <= to.z; z += ChunkArea.size) {
        const key = this.getChunkKey(x, z)
        let chunk = chunks.get(key)

        if (visited.has(chunk)) continue // Skip already visited chunks to not add twice
        chunk ??= new Chunk(x, z, dimensionType)

        // Slows down by 1420%
        // if (!this.isObjectIn(chunk, object)) continue

        visited.add(chunk)
        chunks.set(key, chunk)
        result.push(chunk.add(object))
      }
    }

    bench()

    if (!result.length) throw new Error(`Unable to add point ${inspect(object).replace(/§./g, '')}`)
    return result
  }

  remove(object: T) {
    const dimensionType = this.getObjectDimension(object)
    const chunks = this.getStorage(dimensionType)

    for (const [key, chunk] of chunks) {
      chunk.remove(object)
      if (chunk.isEmpty()) chunks.delete(key)
    }
  }

  storageSize(dimensionType: DimensionType = 'overworld') {
    let chunks = 0
    let objects = 0
    for (const chunk of this.getStorage(dimensionType).values()) {
      objects += chunk.storageSize()
      chunks += 1
    }

    return { objects, chunks }
  }
}
