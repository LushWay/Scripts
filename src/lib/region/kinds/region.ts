import { Player, world } from '@minecraft/server'
import { ChunkArea, ChunkQuery } from 'lib/chunk-query'
import { removeDefaults, setDefaults } from 'lib/database/defaults'
import { ActionForm } from 'lib/form/action'
import { noI18n } from 'lib/i18n/text'
import { util } from 'lib/util'
import { AbstractPoint, toPoint } from 'lib/utils/point'
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

interface RegionConstructor<I extends Region>
  extends Pick<typeof Region, 'regions' | 'getAll' | 'getAt' | 'getManyAt' | 'chunkQuery'> {
  new (...args: any[]): I
}

/** Represents protected region in the world. */
export class Region {
  static readonly kind: string

  static permissionDebug = false

  protected static generateRegionKey(kind: string, area: string, radius: number) {
    const date = new Date()
    let key = `${kind}-${area}-${~~radius}-${date.toYYYYMMDD()}-${date.toHHMM()}`
    if (RegionDatabase.has(key)) {
      let i = 0
      while (RegionDatabase.has(`${key}-${i}`)) i++
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
    if (this !== Region && this.regions === Region.regions) this.regions = []

    // if (!area.isValid()) throw new Error('Area ' + area.toString() + 'is invalid')

    const region = new this(area, options, key ?? this.generateRegionKey(this.kind, area.type, area.radius))
    this.regions.push(region)
    if (this !== Region) Region.regions.push(region)

    region.permissions = setDefaults(options.permissions ?? {}, region.defaultPermissions)
    region.kind = this.kind
    region.creator = this
    if (options.ldb) region.ldb = options.ldb
    if (region.structure) region.structure.validateArea()

    if (!key) {
      // We are creating new region and should save it
      region.save()
      region.onCreate()
    } else {
      // Restoring region with existing key
      region.onRestore()
    }

    if (area.radius) this.chunkQuery.add(region)

    return region as unknown as InstanceType<T>
  }

  static chunkQuery = new ChunkQuery<Region>(
    (location, { area }) => area.isIn({ location, dimensionType: area.dimensionType }),
    (location, { area }, distance) => area.isNear({ location, dimensionType: area.dimensionType }, distance),
    (chunk, { area }) =>
      area.isNear(
        { dimensionType: chunk.dimensionType, location: { ...chunk.center, y: area.center.y } },
        ChunkArea.size,
      ),
    object => object.dimensionType,
    object => object.area.edges,
  )

  /** Regions list */
  static regions: Region[] = []

  /**
   * Filters an array of regions to return instances of a specific region type.
   *
   * @returns Array of instances that match the specified type `R` of Region.
   */
  static getAll<I extends Region>(this: RegionConstructor<I> | typeof Region): I[] {
    return this.regions as I[]
  }

  /**
   * Returns an array of regions of the type of the caller that are near a specified point within a given radius.
   *
   * @param point - Represents point in the world
   */
  static getNear<I extends Region>(
    this: RegionConstructor<I> | typeof Region,
    point: AbstractPoint,
    radius: number,
    chunkQuery = false, // Still slower. Need to investigate
  ): I[] {
    point = toPoint(point)

    if (chunkQuery) {
      const all = this.chunkQuery.getNear(point, radius)
      return (this === Region ? all : all.filter(e => e instanceof this)) as I[]
    }

    return (this.regions as I[]).filter(region => region.area.isNear(point, radius))
  }

  /**
   * Returns the nearest region based on a block location and dimension ID.
   *
   * @param point - Represents point in the world
   */
  static getAt<I extends Region>(this: RegionConstructor<I>, point: AbstractPoint): I | undefined {
    return this.getManyAt(point)[0]
  }

  /**
   * Returns the nearest regions based on a block location and dimension ID.
   *
   * @param point - Represents point in the world
   */
  static getManyAt<I extends Region>(
    this: RegionConstructor<I> | typeof Region,
    point: AbstractPoint,
    chunkQuery = true, // 99% faster then iteration
  ): I[] {
    point = toPoint(point)

    if (chunkQuery) {
      const all = this.chunkQuery.getAt(point)
      const filtered = (this === Region ? all : all.filter(e => e instanceof this)) as I[]
      return filtered.sort((a, b) => b.priority - a.priority)
    }

    return (this.regions as I[]).filter(region => region.area.isIn(point)).sort((a, b) => b.priority - a.priority)
  }

  /** Region priority. Used in {@link Region.getAt} */
  protected readonly priority: number = 0

  /** Region dimension */
  get dimensionType(): DimensionType {
    return this.area.dimensionType
  }

  /** Region permissions */
  permissions!: RegionPermissions

  /** Permissions used by default */
  protected readonly defaultPermissions: RegionPermissions = defaultRegionPermissions()

  /** Database linked to the region */
  ldb!: JsonObject | undefined

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
  ) {}

  /** Function that gets called on region creation after saving (once) */
  protected onCreate() {
    // Hook
  }

  /** Function that gets called on restore */
  protected onRestore() {
    // Hook
  }

  get dimension() {
    return world[this.dimensionType]
  }

  /** Region owner name */
  get ownerName() {
    return Player.name(this.permissions.owners[0])
  }

  /** Name of the region that should always be */
  get name(): Text {
    return this.ownerName ?? this.id
  }

  /** Name that will be displayed on the sidebar e.g. It can be empty. */
  get displayName(): Text | undefined {
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
      permissions: removeDefaults(this.permissions, this.defaultPermissions),
      dimensionId: this.dimensionType,
      ldb: this.ldb,
    }
  }

  /** Updates this region in the database */
  save() {
    if (!(RegionIsSaveable in this)) return false

    RegionDatabase.set(this.id, this.toJSON())
  }

  /** Removes this region */
  delete() {
    this.structure?.delete()
    Region.chunkQuery.remove(this)
    Region.regions = Region.regions.filter(e => e.id !== this.id)
    this.creator.regions = this.creator.regions.filter(e => e.id !== this.id)
    RegionDatabase.delete(this.id)
  }

  /** Can be overriden to add custom buttons to the .region edit form */
  customFormButtons(form: ActionForm, player: Player) {
    // Can be overriden to add custom buttons
  }

  /** Can be overriden to add custom description */
  customFormDescription(player: Player): Text.Table {
    return [[noI18n`Приоритет`, this.priority]]
  }
}

export const RegionIsSaveable = Symbol('region.saveable')
