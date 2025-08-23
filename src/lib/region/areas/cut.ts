import { AbstractPoint, toPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { Area, AreaAsJson } from './area'
import { CylinderArea } from './cylinder'
import { SphereArea } from './sphere'

interface CutDatabase extends JsonObject {
  parent: AreaAsJson
  cut: {
    axis: 'x' | 'y' | 'z'
    from?: number
    to?: number
  }
}

class Cut extends Area<CutDatabase> {
  type = 'cut'

  protected parent?: Area

  constructor(database: CutDatabase, dimensionType?: DimensionType) {
    super(database, dimensionType)
    if (typeof database.parent === 'object') this.parent = Area.fromJson(database.parent)
  }

  isNear(point: AbstractPoint, distance: number): boolean {
    if (!this.parent) return false
    const { location: vector, dimensionType } = toPoint(point)
    const {
      cut: { axis, from, to },
    } = this.database

    return (
      this.parent.isNear({ location: vector, dimensionType }, distance) &&
      (typeof from === 'number' ? vector[axis] > from - distance : true) &&
      (typeof to === 'number' ? vector[axis] < to + distance : true)
    )
  }

  get edges(): [Vector3, Vector3] {
    if (!this.parent) return [Vec.zero, Vec.zero]
    return this.parent.edges
  }

  get radius() {
    return this.parent?.radius ?? 0
  }

  set radius(r) {
    if (this.parent instanceof SphereArea || this.parent instanceof CylinderArea) this.parent.radius = r
  }

  get center() {
    return this.parent?.center ?? Vec.zero
  }

  set center(c) {
    if (this.parent instanceof SphereArea || this.parent instanceof CylinderArea) this.parent.center = c
  }

  getFormDescription(): Text.Table {
    return [['Cut', this.database.cut], ...(this.parent?.getFormDescription() ?? [])]
  }
}

export const CutArea = Cut.asSaveableArea()
