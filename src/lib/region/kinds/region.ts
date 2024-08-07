import { Player } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { ProxyDatabase } from 'lib/database/proxy'
import { util } from 'lib/util'
import { RLDB, RegionDatabase, RegionSave } from '../database'

/** Role of the player related to the region */
export type RegionPlayerRole = 'owner' | 'member' | false

/** Permissions of the region */
export interface RegionPermissions extends Record<string | number | symbol, unknown> {
  /** If the player can use chests, defualt: true */
  doorsAndSwitches: boolean
  /** If the player can use doors, default: true */
  openContainers: boolean
  /** If players can fight, default: false */
  pvp: boolean
  /** The entities allowed to spawn in this region */
  allowedEntities: string[] | 'all'
  /** Owners of region */
  owners: string[]
}

/** Options used in {@link Region.create} */
export interface RegionCreationOptions {
  dimensionId: Dimensions
  permissions?: Partial<RegionPermissions>
}

/** Represents protected region in the world. */
export class Region<LDB extends RLDB = any> {
  static readonly type: string

  static readonly kind: string

  protected static generateRegionKey() {
    return new Date(Date.now()).toISOString()
  }

  /** Creates a new region */
  static create<T extends typeof Region>(this: T, options: ConstructorParameters<T>[0], key?: string): InstanceType<T> {
    const region = new this(options, key ?? this.generateRegionKey())

    region.permissions = ProxyDatabase.setDefaults(options.permissions ?? {}, region.defaultPermissions)
    region.type = this.type
    region.kind = this.kind
    region.creator = this

    if (!key) {
      // We are creating new region and should save it
      region.save()
      region.onCreate()
    } else {
      // Restoring region with existing key
      region.onRestore()
    }

    return region as unknown as InstanceType<T>
  }

  /** Regions list */
  static regions: Region[] = []

  /**
   * Filters an array of regions to return instances of a specific region type.
   *
   * @param {R} type - Region subclass to get
   * @returns Array of instances that match the specified type `R` of Region.
   */
  static regionInstancesOf<R extends typeof Region>(type: R): InstanceType<R>[] {
    return this.regions.filter((e => e instanceof type) as (e: Region) => e is InstanceType<R>)
  }

  /**
   * Filters an array of regions to return instances of a specific region type.
   *
   * @returns Array of instances that match the specified type `R` of Region.
   */
  static instances<I extends Region, T extends { new (): I; regions: Region[] }>(this: T) {
    return this.regions.filter((e => e instanceof this) as (e: Region) => e is I)
  }

  /**
   * Returns the nearest region based on a block location and dimension ID.
   *
   * @param {Vector3} location - Representing the location of a block in the world
   * @param {Dimensions} dimensionId - Specific dimension in the world. It is used to specify the dimension in which the
   *   block location is located.
   */
  static nearestRegion(location: Vector3, dimensionId: Dimensions): Region | undefined {
    return this.nearestRegions(location, dimensionId)[0]
  }

  /**
   * Returns the nearest regions based on a block location and dimension ID.
   *
   * @param {Vector3} location - Representing the location of a block in the world
   * @param {Dimensions} dimensionId - Specific dimension in the world. It is used to specify the dimension in which the
   *   block location is located.
   */
  static nearestRegions(location: Vector3, dimensionId: Dimensions) {
    const regions = this === Region ? this.regions : this.regionInstancesOf(this)

    return regions
      .filter(region => region.isVectorInRegion(location, dimensionId))
      .sort((a, b) => b.priority - a.priority)
  }

  /** Region priority. Used in {@link Region.nearestRegion} */
  protected readonly priority: number = 0

  /** Region dimension */
  dimensionId: Dimensions

  /** Region permissions */
  // @ts-expect-error This not really an issue
  permissions: RegionPermissions

  /** Permissions used by default */
  protected readonly defaultPermissions: RegionPermissions = {
    doorsAndSwitches: true,
    openContainers: true,
    pvp: false,
    allowedEntities: [MinecraftEntityTypes.Player, 'minecraft:item'],
    owners: [],
  }

  /**
   * Creates the region
   *
   * @param o - Region creation options
   * @param o.dimensionId - The dimension ID of the region.
   * @param o.permissions - An object containing the permissions for the region.
   * @param o.key - The key of the region. This is used to identify the region.
   */
  constructor(
    { dimensionId }: RegionCreationOptions,
    protected key: string,
  ) {
    this.dimensionId = dimensionId
    if (key) Region.regions.push(this)
  }

  /** Function that gets called on region creation after saving (once) */
  protected onCreate() {
    // Hook
  }

  /** Function that gets called on restore */
  protected onRestore() {
    // Hook
  }

  /** Checks if the vector is in the region */
  isVectorInRegion(vector: Vector3, dimensionId: Dimensions) {
    if (this.dimensionId !== dimensionId) return false

    // See the implementation in the sub class
    return true
  }

  /** Region owner name */
  get ownerName() {
    return Player.name(this.permissions.owners[0])
  }

  /** Name of the region that should always be */
  get name() {
    return this.ownerName ?? new Date(this.key).format()
  }

  /** Name that will be displayed on the sidebar e.g. It can be empty. */
  get displayName(): string | undefined {
    return undefined
  }

  /**
   * Returns region role of specified player
   *
   * @param playerOrId
   */
  getMemberRole(playerOrId: string | Player): RegionPlayerRole {
    const id = playerOrId instanceof Player ? playerOrId.id : playerOrId
    if (this.permissions.owners[0] === id) return 'owner'
    if (this.permissions.owners.includes(id)) return 'member'
    return false
  }

  /**
   * Checks if a player with a given `playerId` is a member of the region
   *
   * @param playerId - The id of the player
   */
  isMember(playerId: string) {
    return !!this.getMemberRole(playerId)
  }

  /**
   * A function that will loop through all the owners of a region and call the callback function on each of them.
   *
   * @param callback - Callback to run
   */
  forEachOwner(callback: Parameters<Player[]['forEach']>[0]) {
    const onlineOwners = []
    for (const ownerId of this.permissions.owners) {
      const player = Player.getById(ownerId)
      if (player) onlineOwners.push(player)
    }
    onlineOwners.forEach(
      (player, i, owners) => player.isValid() && util.catch(() => callback(player, i, owners), 'Region.forEachOwner'),
    )
  }

  /** Database linked to the region */
  linkedDatabase!: LDB

  /** Region kind */
  private kind!: string

  /** Region type */
  private type!: string

  /** Prepares region instance to be saved into the database */
  protected toJSON(): RegionSave {
    return {
      t: this.type,
      st: this.kind,
      permissions: ProxyDatabase.removeDefaults(this.permissions, this.defaultPermissions),
      dimensionId: this.dimensionId,
      ldb: this.linkedDatabase,
    }
  }

  /** Whenether region should be saved into the database or if its runtime-only, e.g. BossRegion */
  protected readonly saveable: boolean = true

  /** Updates this region in the database */
  save() {
    if (!this.saveable) return false

    RegionDatabase[this.key] = this.toJSON()
  }

  /** Removes this region */
  delete() {
    Region.regions = Region.regions.filter(e => e.key !== this.key)
    Reflect.deleteProperty(RegionDatabase, this.key)
  }

  creator!: typeof Region
}
