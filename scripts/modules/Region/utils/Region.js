import { BlockLocation, Entity, Player, world } from "@minecraft/server";
import { handler, XA } from "../../../xapi.js";
import { DEFAULT_REGION_PERMISSIONS } from "./config.js";

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
	return XYZc.every((c, i) => c >= Math.min(XYZa[i], XYZb[i]) && c <= Math.max(XYZa[i], XYZb[i]));
}

const TABLE = XA.tables.region;

export class Region {
	/**
	 * Gets all regions
	 * @returns {Region[]}
	 */
	static getAllRegions() {
		if (REGIONS_HAVE_BEEN_GRABBED) return REGIONS;
		const regions = TABLE.values().map(
			(region) => new Region(region.from, region.to, region.dimensionId, region.permissions, region.key, false)
		);
		regions.forEach((r) => {
			REGIONS.push(r);
		});
		return regions;
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
	 * @returns {boolean} if the region was removed or not
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
	 *
	 * @param {IRegionCords} from
	 * @param {IRegionCords} to
	 * @param {string} dimensionId
	 * @param {IRegionPermissions} [permissions]
	 * @param {string} [key]
	 */
	constructor(from, to, dimensionId, permissions, key, creating = true) {
		this.from = from;
		this.to = to;
		this.dimensionId = dimensionId;
		this.permissions = permissions ?? DEFAULT_REGION_PERMISSIONS;
		key = key ?? new Date(Date.now()).toISOString();
		this.key = key;
		if (creating) {
			this.update();
			REGIONS.push(this);
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
	 *
	 * @param {(player: Player, index: number, array: Player[]) => void | Promise<void>} callback
	 */
	forEachOwner(callback) {
		// TODO Make it to activate if player has joined the world and when it joins again callback will be called
		if (this.permissions.owners.length < 1) return;
		this.permissions.owners
			.map(XA.Entity.fetch)
			.filter((e) => e)
			.forEach((player, i, owners) => handler(() => callback(player, i, owners), "Region.forEachOwner"));
	}
}
