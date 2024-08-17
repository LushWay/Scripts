import { Dimension, system, world } from '@minecraft/server'
import { Vector } from 'lib/vector'

export type AreaCreator = new (o: any) => Area
export type TypedArea<T = AreaCreator> = T & {
  type: string
}

export abstract class Area<T extends JsonObject = JsonObject> {
  static areas: TypedArea[] = []

  static loaded = false

  static SaveableArea<T extends AreaCreator>(this: T) {
    const b = this as TypedArea<T>
    b.type = new (this as unknown as AreaCreator)({}).type

    if ((this as unknown as typeof Area).loaded) {
      throw new Error(
        `Registering area type ${b.type} failed. Regions are already restored from json. Registering area should occur on the import-time.`,
      )
    }

    ;(this as unknown as typeof Area).areas.push(b as unknown as TypedArea)
    return b
  }

  constructor(
    protected database: T,
    public dimensionId: Dimensions = 'overworld',
  ) {}

  abstract type: string

  /** Checks if the vector is in the region */
  isVectorIn(vector: Vector3, dimensionId: Dimensions) {
    if (this.dimensionId !== dimensionId) return false

    // See the implementation in the sub class
    return true
  }

  /** Edges of the area */
  abstract get edges(): [Vector3, Vector3]

  /** Center of the area */
  abstract get center(): Vector3

  abstract isNear(vector: Vector3, distance: number): boolean

  get radius() {
    return Vector.distance(...this.edges) / 2
  }

  get size() {
    const [from, to] = this.edges
    return Vector.subtract(from, to)
  }

  /**
   * Json representation that is used to save area to the database. Then result of this function will be provided to
   * restore the same state
   */
  toJSON() {
    return { t: this.type, d: this.database }
  }

  protected get dimension() {
    return world[this.dimensionId]
  }

  forEachVector(callback: (vector: Vector3, isIn: boolean, dimension: Dimension) => void) {
    const { edges, dimension } = this
    const isIn = (v: Vector3) => this.isVectorIn(v, this.dimensionId)

    return new Promise<void>((resolve, reject) => {
      system.runJob(
        (function* forEachRegionVectorJob() {
          try {
            for (const vector of Vector.foreach(...edges)) {
              callback(vector, isIn(vector), dimension)
              yield
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
