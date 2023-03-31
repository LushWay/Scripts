import { Dimension, Entity, Player, Vector } from "@minecraft/server";
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
 * Compare a array of numbers with 2 arrays
 * @param {[number, number, number]} XYZa  The first set of numbers
 * @param {[number, number, number]} XYZb  The second set of numbers
 * @param {[number, number, number]} XYZc  The set of numbers that should between the first and second set of numbers
 * @example betweenXYZ([1, 0, 1], [22, 81, 10], [19, 40, 6]));
 * @returns {boolean}
 */
function betweenXYZ(XYZa, XYZb, XYZc) {
	return XYZc.every(
		(c, i) => c >= Math.min(XYZa[i], XYZb[i]) && c <= Math.max(XYZa[i], XYZb[i])
	);
}

const TABLE = XA.tables.region;
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
				region.dimensionId == dimensionId &&
				betweenXYZ(
					[region.from.x, LOWEST_Y_VALUE, region.from.z],
					[region.to.x, HIGEST_Y_VALUE, region.to.z],
					[blockLocation.x, blockLocation.y, blockLocation.z]
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
	 * Checks if a entity is in this region
	 * @param {Entity} entity - Entity to check
	 * @returns {boolean} - if a entity is in this region or not
	 */
	entityInRegion(entity) {
		return (
			this.dimensionId == entity.dimension.id &&
			betweenXYZ(
				[this.from.x, LOWEST_Y_VALUE, this.from.z],
				[this.to.x, HIGEST_Y_VALUE, this.to.z],
				[entity.location.x, entity.location.y, entity.location.z]
			)
		);
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

/**
 * WorkWithItems() will get all the items within a 2 block radius of the given location and then call
 * the given callback function on each of them.
 * @param {Dimension} dimension - The dimension you want to work with.
 * @param {Vector3} location  - The location to search around.
 * @param {(e: Entity) => any} callback - The function to run on each item.
 */
export function WorkWithItems(dimension, location, callback = (e) => e.kill()) {
	dimension
		.getEntities({
			location: location,
			maxDistance: 2,
			type: "minecraft:item",
		})
		.forEach(callback);
}

