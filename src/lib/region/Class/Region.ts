import { Player } from '@minecraft/server'
import { ProxyDatabase } from 'lib/database/proxy'
import { DatabaseUtils } from 'lib/database/utils'
import { EventSignal } from 'lib/event-signal'
import { REGION_DB } from 'lib/region/DB'
import { DEFAULT_REGION_PERMISSIONS } from 'lib/region/config'
import { util } from 'lib/util'
import { WeakPlayerMap } from 'lib/weak-player-map'

export type RegionPlayerRole = 'owner' | 'member' | false

/** Main class that represents protected region in the world. */
export class Region {
  /** Regions list */
  static regions: Region[] = []

  static regionInstancesOf<R extends typeof Region>(type: R): InstanceType<R>[] {
    return this.regions.filter((e => e instanceof type) as (e: Region) => e is InstanceType<R>)
  }

  static playerInRegionsCache: WeakPlayerMap<Region[]> = new WeakPlayerMap({ removeOnLeave: true })

  /** Event that triggers when player regions have changed. Interval 1 second */
  static onPlayerRegionsChange: EventSignal<{ player: Player; previous: Region[]; newest: Region[] }> =
    new EventSignal()

  static onEnter(region: Region, callback: PlayerCallback) {
    this.onPlayerRegionsChange.subscribe(({ player, newest, previous }) => {
      if (!previous.includes(region) && newest.includes(region)) callback(player)
    })
  }

  /** Returns nearest and more prioritizet region */
  static locationInRegion(blockLocation: Vector3, dimensionId: Dimensions): Region | undefined {
    return this.nearestRegions(blockLocation, dimensionId)[0]
  }

  /** Returns regions that location is in and sorts them by priority */
  static nearestRegions(blockLocation: Vector3, dimensionId: Dimensions) {
    const regions = this === Region ? this.regions : this.regionInstancesOf(this)

    const c1 = regions.filter(region => region.dimensionId === dimensionId && region.vectorInRegion(blockLocation))
    const c2 = c1.sort((a, b) => b.priority - a.priority)

    return c2
  }

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
   * @param {object} o
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
  vectorInRegion(vector: Vector3) {
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
      permissions: DatabaseUtils.removeDefaults(this.permissions, this.defaultPermissions),
      dimensionId: this.dimensionId,
    }
  }

  /** Removes this region */
  delete() {
    Region.regions = Region.regions.filter(e => e.key !== this.key)
    delete REGION_DB[this.key]
  }
}
