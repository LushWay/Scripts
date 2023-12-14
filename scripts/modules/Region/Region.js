import { Player, Vector } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { DB, util } from 'smapi.js'
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
 *  permissions: Partial<IRegionPermissions>;
 *  to: IRegionCords;
 * }} ICubeRegion
 */

/**
 * @typedef {{
 *  t: "r"
 *  st: string
 *  key: string;
 *  radius: number;
 *  center: Vector3;
 *  dimensionId: Dimensions;
 *  permissions: Partial<IRegionPermissions>;
 * }} IRadiusRegion
 */

const REGION_DB_PROPERTY = new DynamicPropertyDB('region', {
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

export const REGION_DB = REGION_DB_PROPERTY.proxy()

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
      REGION_DB_PROPERTY.init()

      Object.values(REGION_DB).forEach(region => {
        if (region.t === 'c')
          Region.regions.push(
            new CubeRegion({
              ...region,
              creating: false,
            })
          )
        else {
          const RadiusRegionSubtype =
            RadiusRegionSubTypes.find(e => e.prototype.subtype === region.st) ??
            RadiusRegion

          Region.regions.push(
            new RadiusRegionSubtype({
              ...region,
              creating: false,
            })
          )
        }
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

  basePermissions = Region.config.permissions

  /**
   * Creates a new region
   * @param {object} o
   * @param {Dimensions} o.dimensionId - The dimension ID of the region.
   * @param {Partial<IRegionPermissions>} [o.permissions] - An object containing the permissions for the region.
   * @param {string} [o.key] - The key of the region. This is used to identify the region.
   */
  constructor({ dimensionId, permissions, key }) {
    this.dimensionId = dimensionId
    this.key = key ?? new Date(Date.now()).toISOString()
  }

  /**
   * @param {Partial<IRegionPermissions> | undefined} permissions
   */
  initPermissions(permissions) {
    this.permissions = DB.setDefaults(permissions ?? {}, this.basePermissions)
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
   * Name of the region owner
   */
  get ownerName() {
    return Player.name(this.permissions.owners[0])
  }

  /**
   * Display name of the region
   */
  get name() {
    return (
      this.ownerName ??
      new Date(this.key).toLocaleString([], {
        hourCycle: 'h24',
      })
    )
  }

  /**
   * @typedef {'owner' | 'member' | false} RegionPlayerRole
   */

  /**
   * Returns role of specified player
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
  update() {
    return {
      permissions: DB.removeDefaults(this.permissions, this.basePermissions),
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
   * @param {object}o
   * @param {IRegionCords} o.from - The position of the first block of the region.
   * @param {IRegionCords} o.to - The position of the region's end.
   * @param {Dimensions} o.dimensionId - The dimension ID of the region.
   * @param {Partial<IRegionPermissions>} [o.permissions] - An object containing the permissions for the region.
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
  vectorInRegion(vector) {
    return Vector.between(
      { x: this.from.x, y: LOWEST_Y_VALUE, z: this.from.z },
      { x: this.to.x, y: HIGEST_Y_VALUE, z: this.to.z },
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

export class RadiusRegion extends Region {
  subtype = 'cm'
  /**
   * Gets all radius regions
   * @returns {RadiusRegion[]}
   */
  static get regions() {
    // @ts-expect-error Instance filtering misstype
    return Region.regions.filter(e => e instanceof this)
  }
  /** @type {Vector3} */
  center
  /** @type {number} */
  radius
  /**
   * Creates a new region
   * @param {object} o
   * @param {Vector3} o.center - The position of the first block of the region.
   * @param {number} o.radius - The position of the region's end.
   * @param {Dimensions} o.dimensionId - The dimension ID of the region.
   * @param {Partial<IRegionPermissions>} [o.permissions] - An object containing the permissions for the region.
   * @param {string} [o.key] - The key of the region. This is used to identify the region.
   * @param {boolean} [o.creating] - Whether or not the region is being created.
   */
  constructor({
    center,
    radius,
    dimensionId,
    permissions,
    key,
    creating = true,
  }) {
    super({ dimensionId, permissions, key })
    this.initPermissions(permissions)
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
   */
  update() {
    return (REGION_DB[this.key] = {
      ...super.update(),
      t: 'r',
      st: this.subtype,
      key: this.key,
      center: this.center,
      radius: this.radius,
    })
  }
}

export class MineshaftRegion extends RadiusRegion {
  /** @type {IRegionPermissions} */
  basePermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    pvp: true,
    openContainers: true,
    owners: [],
  }
  /**
   * @type {MineshaftRegion[]}
   */
  static get regions() {
    return super.regions
  }
  subtype = 'ms'
}

export class SafeAreaRegion extends RadiusRegion {
  /** @type {IRegionPermissions} */
  basePermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: false,
    pvp: false,
    openContainers: false,
    owners: [],
  }
  /**
   * @type {SafeAreaRegion[]}
   */
  static get regions() {
    return super.regions
  }
  subtype = 'sa'

  /** @param {ConstructorParameters<typeof RadiusRegion>[0]} arg */
  constructor(arg) {
    super(arg)
    this.initPermissions(arg.permissions)
  }
}

export class BaseRegion extends RadiusRegion {
  /** @type {IRegionPermissions} */
  basePermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: false,
    pvp: true,
    openContainers: false,
    owners: [],
  }
  /**
   * @type {BaseRegion[]}
   */
  static get regions() {
    return super.regions
  }
  subtype = 'bs'

  /** @param {ConstructorParameters<typeof RadiusRegion>[0]} arg */
  constructor(arg) {
    super(arg)
    this.initPermissions(arg.permissions)
  }
}

/**
 * Region that will not be saved on disk. (Session only)
 */
export class SessionRegion extends RadiusRegion {
  /**
   * @type {SessionRegion[]}
   */
  static get regions() {
    return super.regions
  }

  // Actually not used
  subtype = 'session'

  update() {
    // Do not save because its per session region
    return Region.prototype.update.call(this)
  }

  /** @param {ConstructorParameters<typeof RadiusRegion>[0]} arg */
  constructor(arg) {
    super(arg)
    this.initPermissions(arg.permissions)
  }
}

export class BossArenaRegion extends SessionRegion {
  /** @type {IRegionPermissions} */
  basePermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    pvp: true,
    openContainers: true,
    owners: [],
  }
  /**
   * @type {BaseRegion[]}
   */
  static get regions() {
    return super.regions
  }

  /** @param {ConstructorParameters<typeof RadiusRegion>[0]} arg */
  constructor(arg) {
    super(arg)
    this.initPermissions(arg.permissions)
  }
}

const RadiusRegionSubTypes = [
  RadiusRegion,
  MineshaftRegion,
  SafeAreaRegion,
  BaseRegion,
]
