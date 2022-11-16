interface IRegionDB {
	dimensionId: string;
	from: IRegionCords;
	to: IRegionCords;
	key: string;
	permissions: IRegionPermissions;
}

interface IRegionCords {
	x: number;
	z: number;
}

interface IRegionPermissions {
	/**
	 * if the player can use chests, defualt: true
	 */
	doorsAndSwitches: Boolean;
	/**
	 * if the player can use doors, default: true
	 */
	openContainers: Boolean;
	/**
	 * if players can fight, default: false
	 */
	pvp: Boolean;
	/**
	 * the entitys allowed in this region
	 */
	allowedEntitys: Array<string>;
	/**
	 * Owners of region
	 */
	owners: Array<string>;
}
