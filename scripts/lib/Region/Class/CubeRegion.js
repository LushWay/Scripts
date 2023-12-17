import { Vector, world } from '@minecraft/server'
import { REGION_DB, Region } from '../index.js'

export class CubeRegion extends Region {
  /**
   * @param {Vector3} blockLocation
   * @param {Dimensions} dimensionId
   * @returns {CubeRegion | undefined}
   */
  static blockLocationInRegion(blockLocation, dimensionId) {
    const region = Region.regionInstancesOf(this).find(
      region => region.dimensionId === dimensionId && region.vectorInRegion(blockLocation)
    )

    if (region instanceof CubeRegion) return region
  }
  /** @type {Point} */
  from
  /** @type {Point} */
  to
  /**
   * Creates a new region
   * @param {object}o
   * @param {Point} o.from - The position of the first block of the region.
   * @param {Point} o.to - The position of the region's end.
   * @param {Dimensions} o.dimensionId - The dimension ID of the region.
   * @param {Partial<RegionPermissions>} [o.permissions] - An object containing the permissions for the region.
   * @param {string} [o.key] - The key of the region. This is used to identify the region.
   * @param {boolean} [o.creating] - Whether or not the region is being created.
   */
  constructor({ from, to, dimensionId, permissions, key, creating = true }) {
    super({ dimensionId, permissions, key })
    this.initPermissions(permissions)
    this.from = from
    this.to = to

    if (creating) {
      this.update()
      Region.regions.push(this)
    }
  }
  /** @param {Vector3} vector */
  vectorInRegion(vector, dimension = world.overworld) {
    return Vector.between(
      { x: this.from.x, y: dimension.heightRange.max, z: this.from.z },
      { x: this.to.x, y: dimension.heightRange.min, z: this.to.z },
      vector
    )
  }
  update() {
    return (REGION_DB[this.key] = {
      ...super.update(),
      t: 'c',
      key: this.key,
      from: this.from,
      to: this.to,
    })
  }
}
