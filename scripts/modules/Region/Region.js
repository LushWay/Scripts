import { Dimension, Entity, Player, Vector } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { util } from 'smapi.js'
import { DEFAULT_REGION_PERMISSIONS } from './config.js'

/**
 * The Lowest Y value in minecraft
 */
const LOWEST_Y_VALUE = -64
/**
 * The HIGEST Y value in minecraft
 */
const HIGEST_Y_VALUE = 320

/**
 * @typedef {{
 *  t: 'c'
 *  key: string;
 *  from: IRegionCords;
 *  dimensionId: Dimensions;
 *  permissions: IRegionPermissions;
 *  to: IRegionCords;
 * }} ICubeRegion
 */

/**
 * @typedef {{
 *  t: "r"
 *  key: string;
 *  radius: number;
 *  center: Vector3;
 *  dimensionId: Dimensions;
 *  permissions: IRegionPermissions;
 * }} IRadiusRegion
 */

const PROPERTY = new DynamicPropertyDB('region', {
  delayedInit: true,
  /**
   * @returns {Partial<IRadiusRegion | ICubeRegion>}
   */
  defaultValue: key => {
    return {
      dimensionId: 'overworld',
      permissions: Region.config.permissions,
      key,
    }
  },
})

const TABLE = PROPERTY.proxy()

export class Region {
  /** @private */
  static permissions = DEFAULT_REGION_PERMISSIONS
  static config = {
    HIGEST_Y_VALUE,
    LOWEST_Y_VALUE,

    SETTED: false,
    /**
     * The default permissions for all regions made
     */
    get permissions() {
      if (!this.SETTED) {
        throw new ReferenceError('Region.CONFIG.PERMISSIONS are not loaded')
      }

      return Region.permissions
    },
    set permissions(update) {
      if (this.SETTED)
        throw new ReferenceError('Already set Region.CONFIG.PERMISSIONS.')

      Region.permissions = update
      this.SETTED = true
      PROPERTY.init()

      Object.values(TABLE).forEach(region => {
        Region.regions.push(
          region.t === 'c'
            ? new CubeRegion(
                region.from,
                region.to,
                region.dimensionId,
                region.permissions,
                region.key,
                false
              )
            : new RadiusRegion(
                region.center,
                region.radius,
                region.dimensionId,
                region.permissions,
                region.key,
                false
              )
        )
      })
    },
  }
  /**
   * Regions list
   * @type {Array<CubeRegion | RadiusRegion>}
   */
  static regions = []

  /**
   * Checks if a block location is in region
   * @param {Vector3} blockLocation
   * @param {Dimensions} dimensionId
   * @returns {CubeRegion | RadiusRegion | undefined}
   */
  static locationInRegion(blockLocation, dimensionId) {
    return this.regions.find(
      region =>
        region.dimensionId === dimensionId &&
        region.vectorInRegion(blockLocation)
    )
  }
  /** @type {Dimensions} */
  dimensionId
  /** @type {string} */
  key
  /** @type {IRegionPermissions} */
  permissions
  /**
   * Creates a new region
   * @param {Dimensions} dimensionId - The dimension ID of the region.
   * @param {IRegionPermissions} [permissions] - An object containing the permissions for the region.
   * @param {string} [key] - The key of the region. This is used to identify the region.
   */
  constructor(dimensionId, permissions, key) {
    this.dimensionId = dimensionId
    this.permissions = permissions ?? Region.config.permissions
    this.key = key ?? new Date(Date.now()).toISOString()
  }
  /**
   * Checks if vector is in region
   * @param {Vector3} vector
   */
  vectorInRegion(vector) {
    // Actual implementation in extended class
    return false
  }
  /**
   * Updates this region in the database
   */
  update() {}
  /**
   * Removes this region
   */
  delete() {
    Region.regions = Region.regions.filter(e => e.key !== this.key)
    delete TABLE[this.key]
  }
  /**
   * A function that will loop through all the owners
   * of a region and call the callback function on each
   * of them.
   * @param {(player: Player, index: number, array: Player[]) => void | Promise<void>} callback - Callback to run
   */
  forEachOwner(callback) {
    const onlineOwners = []
    for (const ownerId of this.permissions.owners) {
      const player = Player.fetch(ownerId)
      if (player) onlineOwners.push(player)
    }
    onlineOwners.forEach(
      (player, i, owners) =>
        player &&
        util.catch(() => callback(player, i, owners), 'Region.forEachOwner')
    )
  }
}

export class CubeRegion extends Region {
  /**
   * Gets all cube regions
   * @returns {CubeRegion[]}
   */
  static get regions() {
    // @ts-expect-error Instance filtering
    return Region.regions.filter(e => e instanceof CubeRegion)
  }
  /**
   * @param {Vector3} blockLocation
   * @param {Dimensions} dimensionId
   * @returns {CubeRegion | undefined}
   */
  static blockLocationInRegion(blockLocation, dimensionId) {
    const region = this.regions.find(
      region =>
        region.dimensionId === dimensionId &&
        region.vectorInRegion(blockLocation)
    )

    if (region instanceof CubeRegion) return region
  }
  /** @type {IRegionCords} */
  from
  /** @type {IRegionCords} */
  to
  /**
   * Creates a new region
   * @param {IRegionCords} from - The position of the first block of the region.
   * @param {IRegionCords} to - The position of the region's end.
   * @param {Dimensions} dimensionId - The dimension ID of the region.
   * @param {IRegionPermissions} [permissions] - An object containing the permissions for the region.
   * @param {string} [key] - The key of the region. This is used to identify the region.
   * @param {boolean} [creating] - Whether or not the region is being created.
   */
  constructor(from, to, dimensionId, permissions, key, creating = true) {
    super(dimensionId, permissions, key)
    this.from = from
    this.to = to

    if (creating) {
      this.update()
      Region.regions.push(this)
    }
  }
  /** @param {Vector3} vector */
  vectorInRegion(vector) {
    return Vector.between(
      { x: this.from.x, y: LOWEST_Y_VALUE, z: this.from.z },
      { x: this.to.x, y: HIGEST_Y_VALUE, z: this.to.z },
      vector
    )
  }
  update() {
    TABLE[this.key] = {
      t: 'c',
      key: this.key,
      from: this.from,
      dimensionId: this.dimensionId,
      permissions: this.permissions,
      to: this.to,
    }
  }
}

export class RadiusRegion extends Region {
  /**
   * Gets all cube regions
   * @returns {RadiusRegion[]}
   */
  static get regions() {
    // @ts-expect-error Instance filtering misstype
    return Region.regions.filter(e => e instanceof RadiusRegion)
  }
  /** @type {Vector3} */
  center
  /** @type {number} */
  radius
  /**
   * Creates a new region
   * @param {Vector3} center - The position of the first block of the region.
   * @param {number} radius - The position of the region's end.
   * @param {Dimensions} dimensionId - The dimension ID of the region.
   * @param {IRegionPermissions} [permissions] - An object containing the permissions for the region.
   * @param {string} [key] - The key of the region. This is used to identify the region.
   * @param {boolean} [creating] - Whether or not the region is being created.
   */
  constructor(center, radius, dimensionId, permissions, key, creating = true) {
    super(dimensionId, permissions, key)
    this.center = center
    this.radius = radius

    if (creating) {
      this.update()
      Region.regions.push(this)
    }
  }
  /**
   *
   * @param {Vector3} vector
   */
  vectorInRegion(vector) {
    return Vector.distance(this.center, vector) < this.radius
  }
  /**
   * Updates this region in the database
   * @returns {void}
   */
  update() {
    TABLE[this.key] = {
      t: 'r',
      key: this.key,
      center: this.center,
      dimensionId: this.dimensionId,
      permissions: this.permissions,
      radius: this.radius,
    }
  }
}

/**
 * Will get all the items within a 2 block radius of the given location and then call
 * the given callback function on each of them.
 * @param {Dimension} dimension - The dimension you want to work with.
 * @param {Vector3} location  - The location to search around.
 * @param {(e: Entity) => any} callback - The function to run on each item.
 */
export function forEachItemAt(dimension, location, callback = e => e.kill()) {
  dimension
    .getEntities({
      location: location,
      maxDistance: 2,
      type: 'minecraft:item',
    })
    .forEach(callback)
}

new Command({
  name: 'region',
  role: 'admin',
  type: 'server',
})
  .literal({ name: 'create' })
  .int('radius')
  .executes((ctx, radius) => {
    const reg = new RadiusRegion(
      Vector.floor(ctx.sender.location),
      radius,
      ctx.sender.dimension.type
    )
    reg.update()
    ctx.reply('Created with radius ' + radius)
  })
