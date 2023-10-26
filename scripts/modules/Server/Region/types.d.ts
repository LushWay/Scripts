interface IRegionDB {
  dimensionId: string
  from: IRegionCords
  to: IRegionCords
  key: string
  permissions: IRegionPermissions
}

interface IRegionCords {
  x: number
  z: number
}

interface IRegionPermissions {
  /**
   * if the player can use chests, defualt: true
   */
  doorsAndSwitches: boolean
  /**
   * if the player can use doors, default: true
   */
  openContainers: boolean
  /**
   * if players can fight, default: false
   */
  pvp: boolean
  /**
   * the entitys allowed in this region
   */
  allowedEntitys: Array<string> | 'all'
  /**
   * Owners of region
   */
  owners: Array<string>
}

type EX<T, EXT> = T extends EXT ? T : EXT
