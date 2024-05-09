import { Vector } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'

import { DynamicPropertyDB } from 'lib/database/properties'
import { Region } from 'lib/Region/Class/Region'
import { REGION_DB } from 'lib/Region/DB'

// Note for future
// Currently subclassing RadiusRegion is just a pain, so instead
// of doing this may be better to use subtype to permission map
// instead of creating subclasses.

export class RadiusRegion extends Region {
  /** Subtype id of the RadiusRegion */
  static subtype = 'radius'

  saveToDisk

  /**
   * Center of the base region
   *
   * @type {Vector3}
   */
  center: Vector3

  /**
   * Radius of the base region
   *
   * @type {number}
   */
  radius: number

  /**
   * Creates a new region
   *
   * @param {object} o
   * @param {Vector3} o.center - The position of the first block of the region.
   * @param {number} o.radius - The position of the region's end.
   * @param {Dimensions} o.dimensionId - The dimension ID of the region.
   * @param {Partial<RegionPermissions>} [o.permissions] - An object containing the permissions for the region.
   * @param {string} [o.key] - The key of the region. This is used to identify the region.
   * @param {boolean} [o.creating] - Whether or not the region is being created as new or restored from memory.
   * @param {boolean} [o.saveToDisk] - Whether or not region will be saved to disk or not
   * @param {boolean} [o.subclassing] - Whether or not the permissions will be inited.
   */
  constructor({
    center,
    radius,
    dimensionId,
    permissions,
    key,
    creating = true,
    saveToDisk = true,
    subclassing = false,
  }: {
    center: Vector3
    radius: number
    dimensionId: Dimensions
    permissions?: Partial<RegionPermissions>
    key?: string
    creating?: boolean
    saveToDisk?: boolean
    subclassing?: boolean
  }) {
    permissions = DynamicPropertyDB.unproxy(permissions)

    super({ dimensionId, permissions, key })
    this.center = DynamicPropertyDB.unproxy(center)
    this.radius = radius
    this.saveToDisk = saveToDisk

    if (!subclassing) this.init({ permissions, creating }, RadiusRegion)
    if (creating) Region.regions.push(this)
  }

  /** @inheritdoc */
  vectorInRegion(vector: Vector3) {
    return Vector.distance(this.center, vector) < this.radius
  }

  /** @inheritdoc */
  update(region = RadiusRegion) {
    if (!this.saveToDisk) return super.update()
    return (REGION_DB[this.key] = {
      ...super.update(),
      t: 'r',
      st: region.subtype,
      key: this.key,
      center: this.center,
      radius: this.radius,
    })
  }
}

/** @typedef {Omit<ConstructorParameters<typeof RadiusRegion>[0], 'initPermissions'>} RadiusRegionSubclassArgument */

export class MineshaftRegion extends RadiusRegion {
  static subtype = 'mine'

  /** More prior then other regions */
  priority = 1

  defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  constructor(arg: RadiusRegionSubclassArgument) {
    super({ ...arg, subclassing: true })
    this.init(arg, MineshaftRegion)
  }
}

export class SafeAreaRegion extends RadiusRegion {
  static subtype = 'safe'

  safeAreaName

  defaultPermissions: RegionPermissions = {
    allowedEntities: [
      MinecraftEntityTypes.Player,
      MinecraftEntityTypes.Npc,
      MinecraftEntityTypes.ArmorStand,
      MinecraftEntityTypes.Chicken,
      MinecraftEntityTypes.ChestMinecart,
      'minecraft:painting',
      'minecraft:item',
    ],
    doorsAndSwitches: false,
    openContainers: false,
    pvp: false,
    owners: [],
  }

  get name() {
    return `Безопасная зона ${this.safeAreaName}` ?? super.name
  }

  allowUsageOfCraftingTable = false

  constructor(arg: RadiusRegionSubclassArgument & { name?: string; allowUsageOfCraftingTable?: boolean }) {
    super({ saveToDisk: false, ...arg, subclassing: true })
    this.safeAreaName = arg.name
    this.allowUsageOfCraftingTable = arg.allowUsageOfCraftingTable ?? true
    this.init(arg, SafeAreaRegion)
  }
}

// TODO Base levels, save structure of inital place on creation, shadow regions after removing etc
export class BaseRegion extends RadiusRegion {
  static subtype = 'base'

  defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: false,
    openContainers: false,
    pvp: true,
    owners: [],
  }

  constructor(arg: RadiusRegionSubclassArgument) {
    super({ ...arg, subclassing: true })
    this.init(arg, BaseRegion)
  }
}

export class BossArenaRegion extends RadiusRegion {
  static subtype = 'boss'

  defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  constructor(arg: RadiusRegionSubclassArgument) {
    super({
      ...arg,
      saveToDisk: false,
      subclassing: true,
    })
    this.init(arg, BossArenaRegion)
  }
}
