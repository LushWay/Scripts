import { Dimension, system, world } from '@minecraft/server'
import { t } from 'lib/text'
import { AbstractPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'

export type AreaCreator = new (o: any) => Area
export type AreaWithType<T = AreaCreator> = T & { type: string }

export interface AreaAsJson extends JsonObject {
  t: string
  d: JsonObject
}

export abstract class Area<T extends JsonObject = JsonObject> {
  static areas: AreaWithType[] = []

  static loaded = false

  static asSaveableArea<T extends AreaCreator>(this: T) {
    const b = this as AreaWithType<T>
    b.type = new (this as unknown as AreaCreator)({}).type

    if ((this as unknown as typeof Area).loaded) {
      throw new Error(
        `Registering area type ${b.type} failed. Regions are already restored from json. Registering area should occur on the import-time.`,
      )
    }

    ;(this as unknown as typeof Area).areas.push(b as unknown as AreaWithType)
    return b
  }

  static fromJson(a: Immutable<AreaAsJson>) {
    Area.loaded = true

    const area = Area.areas.find(e => e.type === a.t)
    if (!area) {
      console.warn(t`[Area][Database] No area found for ${a.t}. Maybe you forgot to register kind or import file?`)
      return
    }

    return new area(a.d)
  }

  constructor(
    protected database: T,
    public dimensionType: DimensionType = 'overworld',
  ) {}

  abstract type: string

  /** Checks if the point is inside the area */
  isIn(point: AbstractPoint) {
    return this.isNear(point, 0)
  }

  /** Edges of the area */
  abstract get edges(): [min: Vector3, max: Vector3]

  /** Center of the area */
  abstract get center(): Vector3

  abstract isNear(point: AbstractPoint, distance: number): boolean

  toString() {
    return t`${Vec.string(Vec.floor(this.center), true)} radius=${Math.floor(this.radius)}`
  }

  abstract getFormDescription(): Record<string, unknown>

  protected isOurDimension(dimensionType: DimensionType) {
    return this.dimensionType === dimensionType
  }

  get radius() {
    return Vec.distance(...this.edges) / 2
  }

  get size() {
    const [from, to] = this.edges
    return Vec.subtract(to, from)
  }

  /**
   * Json representation that is used to save area to the database. Then result of this function will be provided to
   * restore the same state
   */
  toJSON(): AreaAsJson {
    return { t: this.type, d: this.database }
  }

  protected get dimension() {
    return world[this.dimensionType]
  }

  forEachVector(
    callback: (vector: Vector3, isIn: boolean, dimension: Dimension) => void | Promise<void> | symbol,
    yieldEach = 10,
  ) {
    const { edges, dimension } = this
    const isIn = (vector: Vector3) => this.isIn({ vector, dimensionType: this.dimensionType })

    return new Promise<void>((resolve, reject) => {
      system.runJob(
        (function* forEachRegionVectorJob() {
          try {
            let i = 0
            for (const vector of Vec.forEach(...edges)) {
              const result = callback(vector, isIn(vector), dimension)
              if (result === STOP_AREA_FOR_EACH_VECTOR) break
              i++
              if (i % yieldEach === 0) yield
            }
            resolve()
          } catch (e: unknown) {
            reject(e as Error)
          }
        })(),
      )
    })
  }
}

export const STOP_AREA_FOR_EACH_VECTOR = Symbol('Stop area for each vector')
