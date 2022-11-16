import { BlockLocation, Entity, world } from "@minecraft/server";
import { XInstantDatabase } from "../../../lib/Database/index.js";
import { DEFAULT_REGION_PERMISSIONS } from "../config.js";

/**
 * Holds all regions in memory so its not grabbing them so much
 * @type {Region[]}
 */
export const REGIONS = [];
/**
 * If the regions have been grabbed if not it will grab them and set this to true
 */
let REGIONS_HAVE_BEEN_GRABBED = false;
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

const TABLE = new XInstantDatabase(world, "region");

export class Region {
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
	 * Gets all regions
	 * @static
	 * @returns {Region[]}
	 */
	static getAllRegions() {
		if (REGIONS_HAVE_BEEN_GRABBED) return REGIONS;
		const regions = TABLE.values().map(
			(region) =>
				new Region(
					region.from,
					region.to,
					region.dimensionId,
					region.permissions,
					region.key
				)
		);
		regions.forEach((r) => {
			REGIONS.push(r);
		});
		return regions;
	}
	/**
	 * Checks if a block location is in region
	 * @static
	 * @param {BlockLocation} blockLocation
	 * @param {string} dimensionId
	 * @returns {Region}
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
	 * @returns {Boolean} if the region was removed or not
	 * @static
	 * @param {BlockLocation} blockLocation
	 */
	static removeRegionAtBlockLocation(blockLocation, dimensionId) {
		const region = this.blockLocationInRegion(blockLocation, dimensionId);
		if (!region) return false;
		return TABLE.delete(region.key);
	}
	/**
	 *
	 * @param {IRegionCords} from
	 * @param {IRegionCords} to
	 * @param {string} dimensionId
	 * @param {IRegionPermissions} permissions
	 * @param {string} key
	 */
	constructor(from, to, dimensionId, permissions, key) {
		this.from = from;
		this.to = to;
		this.dimensionId = dimensionId;
		this.permissions = permissions ?? DEFAULT_REGION_PERMISSIONS;
		this.key = key ? key : Date.now().toString();
		if (!key) {
			this.update();
			REGIONS.push(this);
		}
	}
	/**
	 * Updates this region in the database
	 * @returns {void}
	 */
	update() {
		TABLE.set(
			this.key,
			JSON.stringify({
				key: this.key,
				from: this.from,
				dimensionId: this.dimensionId,
				permissions: this.permissions,
				to: this.to,
			})
		);
	}
	/**
	 * removes this region
	 * @returns {boolean} if the region was removed succesfully
	 */
	delete() {
		return TABLE.delete(this.key);
	}
	/**
	 * Checks if a player is in this region
	 * @returns {boolean} if a entity is in this region or not
	 * @param {Entity} entity
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
	 * Changes a permission to on or off
	 * @param {string} key
	 * @param {boolean} value
	 * @returns {void}
	 */
	changePermission(key, value) {
		this.permissions[key] = value;
		this.update();
	}
}
