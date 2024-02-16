import { Player } from '@minecraft/server'
import { DB } from 'lib/Database/Default.js'
import { REGION_DB } from 'lib/Region/DB.js'
import { DEFAULT_REGION_PERMISSIONS } from 'lib/Region/config.js'
import { util } from 'lib/util.js'

/**
 * Main class that represents protected region in the world.
 */
export class Region {
  /**
   * Regions list
   * @type {Array<Region>}
   */
  static regions = []

  /**
   * @template {typeof Region} R
   * @param {R} type
   * @returns {InstanceType<R>[]}
   */
  static regionInstancesOf(type) {
    // @ts-expect-error Filter misstype
    return this.regions.filter(e => e instanceof type)
  }

  /**
   * @type {Map<string, Region>}
   */
  static locationInRegionCacheMap = new Map()

  /**
   * Checks if a block location is in region
   * @param {Vector3} blockLocation
   * @param {Dimensions} dimensionId
   * @returns {Region | undefined}
   */
  static locationInRegion(blockLocation, dimensionId) {
    const regions = this === Region ? this.regions : this.regionInstancesOf(this)
    const c1 = regions.filter(region => region.dimensionId === dimensionId && region.vectorInRegion(blockLocation))

    const c2 = c1.sort((a, b) => b.priority - a.priority)

    return c2[0]
  }

  priority = 0

  /**
   * Region dimension
   * @type {Dimensions}
   */
  dimensionId

  /**
   * Unique region key
   * @type {string}
   */
  key
  /**
   * Region permissions
   * @type {RegionPermissions}
   */
  permissions

  /**
   * Permissions used by default
   */
  defaultPermissions = DEFAULT_REGION_PERMISSIONS

  /**
   * Creates the region
   * @param {object} o
   * @param {Dimensions} o.dimensionId - The dimension ID of the region.
   * @param {Partial<RegionPermissions>} [o.permissions] - An object containing the permissions for the region.
   * @param {string} [o.key] - The key of the region. This is used to identify the region.
   */
  constructor({ dimensionId, key }) {
    this.dimensionId = dimensionId
    this.key = key ?? new Date(Date.now()).toISOString()
  }

  /**
   * Sets region permissions based on permissions and default permissions
   * @param {object} o
   * @param {Partial<RegionPermissions> | undefined} [o.permissions]
   * @param {boolean} [o.creating]
   * @param {typeof Region} region
   */
  init({ permissions, creating = true }, region) {
    this.permissions = DB.setDefaults(permissions ?? {}, this.defaultPermissions)
    if (creating) this.update(region)
  }

  /**
   * Checks if vector is in the region
   * @param {Vector3} vector
   */
  vectorInRegion(vector) {
    // Actual implementation in extended classes
    return false
  }

  /**
   * Region owner name
   */
  get ownerName() {
    return Player.name(this.permissions.owners[0])
  }

  /**
   * Display name of the region
   */
  get name() {
    return this.ownerName ?? new Date(this.key).format()
  }

  /**
   * @typedef {'owner' | 'member' | false} RegionPlayerRole
   */

  /**
   * Returns region role of specified player
   * @param {string | Player} playerOrId
   * @returns {RegionPlayerRole}
   */
  regionMember(playerOrId) {
    const id = playerOrId instanceof Player ? playerOrId.id : playerOrId
    if (this.permissions.owners[0] === id) return 'owner'
    if (this.permissions.owners.includes(id)) return 'member'
    return false
  }

  /**
   * Updates this region in the database
   */
  update(region = Region) {
    return {
      permissions: DB.removeDefaults(this.permissions, this.defaultPermissions),
      dimensionId: this.dimensionId,
    }
  }

  /**
   * Removes this region
   */
  delete() {
    Region.regions = Region.regions.filter(e => e.key !== this.key)
    delete REGION_DB[this.key]
  }
  /**
   * A function that will loop through all the owners
   * of a region and call the callback function on each of them.
   * @param {Parameters<Array<Player>['forEach']>[0]} callback - Callback to run
   */
  forEachOwner(callback) {
    const onlineOwners = []
    for (const ownerId of this.permissions.owners) {
      const player = Player.fetch(ownerId)
      if (player) onlineOwners.push(player)
    }
    onlineOwners.forEach(
      (player, i, owners) => player && util.catch(() => callback(player, i, owners), 'Region.forEachOwner')
    )
  }
}
