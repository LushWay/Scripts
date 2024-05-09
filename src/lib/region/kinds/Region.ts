import { Player } from '@minecraft/server'
import { ProxyDatabase } from 'lib/database/proxy'
import { EventSignal } from 'lib/event-signal'
import { DEFAULT_REGION_PERMISSIONS } from 'lib/region/config'
import { RegionDatabase } from 'lib/region/database'
import { util } from 'lib/util'
import { WeakPlayerMap } from 'lib/weak-player-map'

export type RegionPlayerRole = 'owner' | 'member' | false

export interface RegionPermissions {
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

/** Main class that represents protected region in the world. */
export class Region {
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
   * Player map that contains region list that player is currently in. Updated each second by region interval. Used to
   * emit events such as {@link Region.onPlayerRegionsChange}
   */
  static playerInRegionsCache: WeakPlayerMap<Region[]> = new WeakPlayerMap({ removeOnLeave: true })

  /**
   * Event that triggers when player regions have changed. Updated each second by region interval. Uses
   * {@link Region.playerInRegionsCache} under the hood
   */
  static onPlayerRegionsChange: EventSignal<{ player: Player; previous: Region[]; newest: Region[] }> =
    new EventSignal()

  /**
   * Listens for player region changes and triggers a callback when a player enters a specific region.
   *
   * @param region - Represents a specific Region.
   * @param callback - Fnction that will be called when a player enters the specified region.
   */
  static onEnter(region: Region, callback: PlayerCallback) {
    this.onPlayerRegionsChange.subscribe(({ player, newest, previous }) => {
      if (!previous.includes(region) && newest.includes(region)) callback(player)
    })
  }

  /**
   * Returns the nearest region based on a block location and dimension ID.
   *
   * @param {Vector3} blockLocation - Representing the location of a block in the world
   * @param {Dimensions} dimensionId - Specific dimension in the world. It is used to specify the dimension in which the
   *   block location is located.
   */
  static nearestRegion(blockLocation: Vector3, dimensionId: Dimensions): Region | undefined {
    return this.nearestRegions(blockLocation, dimensionId)[0]
  }

  /**
   * Returns the nearest regions based on a block location and dimension ID.
   *
   * @param {Vector3} blockLocation - Representing the location of a block in the world
   * @param {Dimensions} dimensionId - Specific dimension in the world. It is used to specify the dimension in which the
   *   block location is located.
   */
  static nearestRegions(blockLocation: Vector3, dimensionId: Dimensions) {
    const regions = this === Region ? this.regions : this.regionInstancesOf(this)

    const c1 = regions.filter(region => region.dimensionId === dimensionId && region.isVectorInRegion(blockLocation))
    const c2 = c1.sort((a, b) => b.priority - a.priority)

    return c2
  }

  /** Region priority. Used in {@link Region.nearestRegion} */
  priority = 0

  /** Region dimension */
  dimensionId: Dimensions

  /** Unique region key */
  key: string

  /** Region permissions */
  permissions: RegionPermissions

  /** Permissions used by default */
  defaultPermissions = DEFAULT_REGION_PERMISSIONS

  /**
   * Creates the region
   *
   * @param {object} o - Region creation options
   * @param {Dimensions} o.dimensionId - The dimension ID of the region.
   * @param {Partial<RegionPermissions>} [o.permissions] - An object containing the permissions for the region.
   * @param {string} [o.key] - The key of the region. This is used to identify the region.
   */
  constructor({
    dimensionId,
    key,
  }: {
    dimensionId: Dimensions
    permissions?: Partial<RegionPermissions>
    key?: string
  }) {
    this.dimensionId = dimensionId
    this.key = key ?? new Date(Date.now()).toISOString()
  }

  /** Sets the region permissions based on the permissions and the default permissions */
  init(
    { permissions, creating = true }: { permissions?: Partial<RegionPermissions> | undefined; creating?: boolean },
    region: typeof Region,
  ) {
    this.permissions = ProxyDatabase.setDefaults(permissions ?? {}, this.defaultPermissions)
    if (creating) this.update(region)
  }

  /** Checks if the vector is in the region */
  isVectorInRegion(vector: Vector3) {
    // See the implementation in the sub class
    return false
  }

  /** Region owner name */
  get ownerName() {
    return Player.name(this.permissions.owners[0])
  }

  /** Display name of the region */
  get name() {
    return this.ownerName ?? new Date(this.key).format()
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
      (player, i, owners) => player && util.catch(() => callback(player, i, owners), 'Region.forEachOwner'),
    )
  }

  /** Updates this region in the database */
  update(region = Region) {
    return {
      permissions: ProxyDatabase.removeDefaults(this.permissions, this.defaultPermissions),
      dimensionId: this.dimensionId,
    }
  }

  /** Removes this region */
  delete() {
    Region.regions = Region.regions.filter(e => e.key !== this.key)
    delete RegionDatabase[this.key]
  }
}
