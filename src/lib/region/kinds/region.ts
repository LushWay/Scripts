import { Player, world } from '@minecraft/server'
import { ProxyDatabase } from 'lib/database/proxy'
import { util } from 'lib/util'
import { Area } from '../areas/area'
import { defaultRegionPermissions, RegionDatabase, RegionSave } from '../database'
import { RegionStructure } from '../structure'

/** Role of the player related to the region */
export type RegionPlayerRole = 'owner' | 'member' | false

/** Permissions of the region */
export interface RegionPermissions extends Record<string | number | symbol, unknown> {
  /** If the player can use doors, defualt: false */
  doors: boolean
  /** If the player can use switches, defualt: false */
  switches: boolean
  /** If the player can use gates, defualt: false */
  gates: boolean
  /** If the player can use trapdoors, defualt: false */
  trapdoors: boolean
  /** If the player can use doors, default: true */
  openContainers: boolean
  /** If players can fight eachother, or pve if they can fight only entities, default: false */
  pvp: boolean | 'pve'
  /** The entities allowed to spawn in this region */
  allowedEntities: string[] | 'all'
  /** Owners of region */
  owners: string[]

  /** Whenether to allow any items to spawn or only specific with the forceSpawn flag set */
  allowedAllItem: boolean
}

/** Options used in {@link Region.create} */
export interface RegionCreationOptions {
  permissions?: Partial<RegionPermissions>
  ldb?: JsonObject
}

/** Represents protected region in the world. */
export class Region {
  static readonly kind: string

  protected static generateRegionKey(kind: string, area: string, radius: number) {
    const date = new Date()
    let key = `${kind}-${area}-${radius}-${date.toYYYYMMDD()}-${date.toHHMM()}`
    if (key in RegionDatabase) {
      let i = 0
      while (`${key}-${i}` in RegionDatabase) i++
      key = `${key}-${i}`
    }
    return key
  }

  /** Creates a new region */
  static create<T extends typeof Region>(
    this: T,
    area: Area,
    options: ConstructorParameters<T>[1] = {},
    key?: string,
  ): InstanceType<T> {
    const region = new this(area, options, key ?? this.generateRegionKey(this.kind, area.type, area.radius))

    region.permissions = ProxyDatabase.setDefaults(options.permissions ?? {}, region.defaultPermissions)
    region.kind = this.kind
    region.creator = this
    if (options.ldb) region.linkedDatabase = options.ldb
    if (region.structure) region.structure.validateArea()

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
   * @returns Array of instances that match the specified type `R` of Region.
   */
  static instances<I extends Region>(this: { new (...args: any[]): I; regions: Region[] }) {
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

  // TODO rename dimensionId to dimensionType
  /**
   * Returns the nearest regions based on a block location and dimension ID.
   *
   * @param {Vector3} location - Representing the location of a block in the world
   * @param {Dimensions} dimensionId - Specific dimension in the world. It is used to specify the dimension in which the
   *   block location is located.
   */
  static nearestRegions(location: Vector3, dimensionId: Dimensions) {
    const regions = this === Region ? this.regions : this.instances()

    return regions
      .filter(region => region.area.isVectorIn(location, dimensionId))
      .sort((a, b) => b.priority - a.priority)
  }

  /** Region priority. Used in {@link Region.nearestRegion} */
  protected readonly priority: number = 0

  /** Region dimension */
  get dimensionId(): Dimensions {
    return this.area.dimensionId
  }

  /** Region permissions */
  permissions!: RegionPermissions

  /** Permissions used by default */
  protected readonly defaultPermissions: RegionPermissions = defaultRegionPermissions()

  /** Database linked to the region */
  linkedDatabase!: JsonObject | undefined

  /** Region kind */
  private kind!: string

  creator!: typeof Region

  structure?: RegionStructure

  /**
   * Creates the region
   *
   * @param area - Area where region is located
   * @param options - Region creation options
   * @param o.key - The key of the region. This is used to identify the region.
   */
  constructor(
    public area: Area,
    options: RegionCreationOptions,
    readonly id: string,
  ) {
    this.area = area
    if (id) Region.regions.push(this)
  }

  /** Function that gets called on region creation after saving (once) */
  protected onCreate() {
    // Hook
  }

  /** Function that gets called on restore */
  protected onRestore() {
    // Hook
  }

  get dimension() {
    return world[this.dimensionId]
  }

  /** Region owner name */
  get ownerName() {
    return Player.name(this.permissions.owners[0])
  }

  /** Name of the region that should always be */
  get name() {
    return this.ownerName ?? this.id
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
  forEachOwner(callback: (playerOrId: Player | string, isOwner: boolean) => void) {
    const players = world.getAllPlayers()
    for (const owner of this.permissions.owners) {
      util.catch(
        () => callback(players.find(e => e.id === owner) ?? owner, this.permissions.owners[0] === owner),
        'Region.forEachOwner',
      )
    }
  }

  /** Prepares region instance to be saved into the database */
  protected toJSON(): RegionSave {
    return {
      a: this.area.toJSON(),
      k: this.kind,
      permissions: ProxyDatabase.removeDefaults(this.permissions, this.defaultPermissions),
      dimensionId: this.dimensionId,
      ldb: this.linkedDatabase,
    }
  }

  /** Updates this region in the database */
  save() {
    if (!(RegionIsSaveable in this)) return false

    RegionDatabase[this.id] = this.toJSON()
  }

  /** Removes this region */
  delete() {
    this.structure?.delete()
    Region.regions = Region.regions.filter(e => e.id !== this.id)
    Reflect.deleteProperty(RegionDatabase, this.id)
  }
}

export const RegionIsSaveable = Symbol('region.saveable')
