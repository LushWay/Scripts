interface RegionPermissions {
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
