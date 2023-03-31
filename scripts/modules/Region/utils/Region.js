import { Dimension, Entity, Player, Vector } from "@minecraft/server";
import { removeDefaults, setDefaults } from "../../../lib/Database/Defaults.js";
import { Database } from "../../../lib/Database/Rubedo.js";
import { XA, handle } from "../../../xapi.js";

/**
 * The Lowest Y value in minecraft
 */
const LOWEST_Y_VALUE = -64;
/**
 * The HIGEST Y value in minecraft
 */
const HIGEST_Y_VALUE = 320;
/**
 * @type {Database<string, {
 *  key: string;
 *  from: IRegionCords;
 *  dimensionId: string;
 *  permissions: IRegionPermissions;
 *  to: IRegionCords;
 * }>}
 */
const TABLE = XA.tables.region;

Region.getAllRegions(a);

export class Region {
	/**
	 * The default permissions for all regions made
	 * @type {IRegionPermissions}
	 */
	static DEFAULT_REGION_PERMISSIONS = {
		/**
		 * If players in this region can use doors, trapdoors, and switches like buttons and levers
		 */
		doorsAndSwitches: true,
		/**
		 * If players in this region can open containers, this is like chests, furnaces, hoppers, etc
		 */
		openContainers: true,
		/**
		 * If the players in this region can fight each other
		 */
		pvp: false,
		/**
		 * the entitys allowed in this region
		 */
		allowedEntitys: ["minecraft:player", "minecraft:npc", "minecraft:item"],
		owners: [],
	};
	/**
	 * Holds all regions in memory so its not grabbing them so much
	 * @type {Region[]}
	 */
	static REGIONS = [];
	/**
	 * If the regions have been grabbed if not it will grab them and set this to true
	 */
	static REGIONS_HAVE_BEEN_GRABBED = false;
	/**
	 * Gets all regions
	 * @returns {Region[]}
	 */
	static getAllRegions() {
		if (this.REGIONS_HAVE_BEEN_GRABBED) return this.REGIONS;

		this.REGIONS = TABLE.values().map(
			(region) =>
				new Region(
					region.from,
					region.to,
					region.dimensionId,
					region.permissions,
					region.key,
					false
				)
		);

		this.REGIONS_HAVE_BEEN_GRABBED = true;

		return this.REGIONS;
	}
	/**
	 * Checks if a block location is in region
	 * @param {Vector3} blockLocation
	 * @param {string} dimensionId
	 * @returns {Region | undefined}
	 */
	static blockLocationInRegion(blockLocation, dimensionId) {
		return this.getAllRegions().find(
			(region) =>
				region.dimensionId === dimensionId &&
				Vector.between(
					{ x: region.from.x, y: LOWEST_Y_VALUE, z: region.from.z },
					{ x: region.to.x, y: HIGEST_Y_VALUE, z: region.to.z },
					blockLocation
				)
		);
	}
	/**
	 * Removes a region at a block Location
	 * @param {string} dimensionId  the id of this dimension
	 * @param {Vector3} blockLocation
	 */
	static removeRegionAtBlockLocation(blockLocation, dimensionId) {
		const region = this.blockLocationInRegion(blockLocation, dimensionId);
		if (!region) return false;
		return TABLE.delete(region.key);
	}
	/** @type {string} */
	dimensionId;
	/** @type {IRegionCords} */
	from;
	/** @type {IRegionCords} */
	to;
	/** @type {string} */
	key;
	/** @type {IRegionPermissions} */
	permissions;
	/**
	 * Creates a new region
	 * @param {IRegionCords} from - The position of the first block of the region.
	 * @param {IRegionCords} to - The position of the region's end.
	 * @param {string} dimensionId - The dimension ID of the region.
	 * @param {IRegionPermissions} [permissions] - An object containing the permissions for the region.
	 * @param {string} [key] - The key of the region. This is used to identify the region.
	 * @param {boolean} [creating] - Whether or not the region is being created.
	 */
	constructor(from, to, dimensionId, permissions, key, creating = true) {
		this.from = from;
		this.to = to;
		this.dimensionId = dimensionId;
		this.permissions = permissions ?? Region.DEFAULT_REGION_PERMISSIONS;
		key = key ?? new Date(Date.now()).toISOString();
		this.key = key;

		if (creating) {
			this.update();
			Region.REGIONS.push(this);
		}
	}
	/**
	 * Updates this region in the database
	 * @returns {void}
	 */
	update() {
		TABLE.set(this.key, {
			key: this.key,
			from: this.from,
			dimensionId: this.dimensionId,
			permissions: this.permissions,
			to: this.to,
		});
	}
	/**
	 * Removes this region
	 */
	delete() {
		return TABLE.delete(this.key);
	}
	/**
	 * A function that will loop through all the owners
	 * of a region and call the callback function on each
	 * of them.
	 * @param {(player: Player, index: number, array: Player[]) => void | Promise<void>} callback - Callback to run
	 */
	forEachOwner(callback) {
		if (this.permissions.owners.length < 1) return;
		this.permissions.owners
			.map(XA.Entity.fetch)
			.filter((e) => e)
			.forEach((player, i, owners) =>
				handle(() => callback(player, i, owners), "Region.forEachOwner")
			);
	}
}

const defaultRegion = {
	dimensionId: "minecraft:overworld",
	permissions: Region.DEFAULT_REGION_PERMISSIONS,
};

TABLE.on("beforeGet", (key, value) => {
	return setDefaults(value, { ...defaultRegion, key });
});
TABLE.on("beforeSet", (key, value) => {
	return removeDefaults(value, { ...defaultRegion, key });
});

/**
 * Will get all the items within a 2 block radius of the given location and then call
 * the given callback function on each of them.
 * @param {Dimension} dimension - The dimension you want to work with.
 * @param {Vector3} location  - The location to search around.
 * @param {(e: Entity) => any} callback - The function to run on each item.
 */
export function forEachItemAt(dimension, location, callback = (e) => e.kill()) {
	dimension
		.getEntities({
			location: location,
			maxDistance: 2,
			type: "minecraft:item",
		})
		.forEach(callback);
}

