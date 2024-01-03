import { Vector } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Region } from 'lib/Region/Class/Region.js'
import { REGION_DB } from 'lib/Region/DB.js'

export class RadiusRegion extends Region {
  subtype = 'radius'

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
   * @param {Partial<RegionPermissions>} [o.permissions] - An object containing the permissions for the region.
   * @param {string} [o.key] - The key of the region. This is used to identify the region.
   * @param {boolean} [o.creating] - Whether or not the region is being created as new or restored from memory.
   * @param {boolean} [o.initPermissions] - Whether or not the permissions will be inited.
   * @param {boolean} [o.saveToDisk] - Whether or not region will be saved to disk or not
   */
  constructor({
    center,
    radius,
    dimensionId,
    permissions,
    key,
    creating = true,
    initPermissions = true,
    saveToDisk = true,
  }) {
    super({ dimensionId, permissions, key })
    if (initPermissions) this.initPermissions(permissions)
    this.center = center
    this.radius = radius
    this.saveToDisk = saveToDisk

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
    if (!this.saveToDisk) return super.update()
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

/**
 * @typedef {Omit<ConstructorParameters<typeof RadiusRegion>[0], 'initPermissions'>} RadiusRegionSubtypeArg
 */

export class MineshaftRegion extends RadiusRegion {
  subtype = 'mine'

  /** @type {RegionPermissions} */
  defaultPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  /** @param {RadiusRegionSubtypeArg} arg */
  constructor(arg) {
    super({ ...arg, initPermissions: false })
    this.initPermissions(arg.permissions)
  }
}

export class SafeAreaRegion extends RadiusRegion {
  subtype = 'safe'

  /** @type {RegionPermissions} */
  defaultPermissions = {
    allowedEntities: [
      MinecraftEntityTypes.Player,
      MinecraftEntityTypes.Npc,
      MinecraftEntityTypes.ArmorStand,
      'minecraft:painting',
      'minecraft:item',
    ],
    doorsAndSwitches: false,
    openContainers: false,
    pvp: false,
    owners: [],
  }

  get name() {
    return 'Безопасная зона ' + this.safeAreaName ?? super.name
  }

  allowUsageOfCraftingTable = false

  /** @param {RadiusRegionSubtypeArg & { name?: string, allowUsageOfCraftingTable?: boolean }} arg */
  constructor(arg) {
    super({ saveToDisk: false, ...arg, initPermissions: false })
    this.safeAreaName = arg.name
    this.allowUsageOfCraftingTable = arg.allowUsageOfCraftingTable ?? false
    this.initPermissions(arg.permissions)
  }
}

export class BaseRegion extends RadiusRegion {
  subtype = 'base'

  /** @type {RegionPermissions} */
  defaultPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: false,
    openContainers: false,
    pvp: true,
    owners: [],
  }

  /** @param {RadiusRegionSubtypeArg} arg */
  constructor(arg) {
    super({ ...arg, initPermissions: false })
    this.initPermissions(arg.permissions)
  }
}

export class BossArenaRegion extends RadiusRegion {
  subtype = 'boss'

  /** @type {RegionPermissions} */
  defaultPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  /** @param {RadiusRegionSubtypeArg} arg */
  constructor(arg) {
    super({
      ...arg,
      saveToDisk: false,
      initPermissions: false,
    })
    this.initPermissions(arg.permissions)
  }
}
