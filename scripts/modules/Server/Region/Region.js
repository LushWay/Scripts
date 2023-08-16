import { Dimension, Entity, Player, Vector } from "@minecraft/server";
import { DB } from "lib/Database/Default.js";
import { Database } from "lib/Database/Rubedo.js";
import { XEntity, util } from "xapi.js";
import { DEFAULT_REGION_PERMISSIONS } from "./config.js";

/**
 * The Lowest Y value in minecraft
 */
const LOWEST_Y_VALUE = -64;
/**
 * The HIGEST Y value in minecraft
 */
const HIGEST_Y_VALUE = 320;

/**
 * @typedef {{
 *  t: 'c'
 *  key: string;
 *  from: IRegionCords;
 *  dimensionId: Dimensions;
 *  permissions: IRegionPermissions;
 *  to: IRegionCords;
 * }} ICubeRegion
 */

/**
 * @typedef {{
 *  t: "r"
 *  key: string;
 *  radius: number;
 *  center: Vector3;
 *  dimensionId: Dimensions;
 *  permissions: IRegionPermissions;
 * }} IRadiusRegion
 */

/**
 * @type {Database<string, IRadiusRegion | ICubeRegion>}
 */
const TABLE = new Database("region");

export class Region {
	/** @private */
	static PERMISSIONS = DEFAULT_REGION_PERMISSIONS;
	static CONFIG = {
		HIGEST_Y_VALUE,
		LOWEST_Y_VALUE,

		PERMS_SETTED: false,
		/**
		 * The default permissions for all regions made
		 */
		get PERMISSIONS() {
			if (!this.PERMS_SETTED)
				throw new ReferenceError(
					"Cannot access Region.CONFIG.PERMISSIONS before setting."
				);

			return Region.PERMISSIONS;
		},
		set PERMISSIONS(NEW) {
			if (this.PERMS_SETTED)
				throw new ReferenceError("Already set Region.CONFIG.PERMISSIONS.");

			Region.PERMISSIONS = NEW;
			this.PERMS_SETTED = true;
		},

		/**
		 * If the regions have been grabbed if not it will grab them and set this to true
		 */
		GRABBED: false,
	};
	/**
	 * Holds all regions in memory so its not grabbing them so much
	 * @type {Array<CubeRegion | RadiusRegion>}
	 */
	static REGIONS = [];
	/**
	 * Gets all regions
	 * @returns {Array<CubeRegion | RadiusRegion>}
	 */
	static getAllRegions() {
		if (this.CONFIG.GRABBED) return this.REGIONS;

		this.REGIONS = [];
		TABLE.values().forEach((region) => {
			this.REGIONS.push(
				region.t === "c"
					? new CubeRegion(
							region.from,
							region.to,
							region.dimensionId,
							region.permissions,
							region.key,
							false
					  )
					: new RadiusRegion(
							region.center,
							region.radius,
							region.dimensionId,
							region.permissions,
							region.key,
							false
					  )
			);
		});

		this.CONFIG.GRABBED = true;

		return this.REGIONS;
	}
	/**
	 * Checks if a block location is in region
	 * @param {Vector3} blockLocation
	 * @param {Dimensions} dimensionId
	 * @returns {CubeRegion | RadiusRegion | undefined}
	 */
	static locationInRegion(blockLocation, dimensionId) {
		return this.getAllRegions().find(
			(region) =>
				region.dimensionId === dimensionId &&
				region.vectorInRegion(blockLocation)
		);
	}
	/** @type {Dimensions} */
	dimensionId;
	/** @type {string} */
	key;
	/** @type {IRegionPermissions} */
	permissions;
	/**
	 * Creates a new region
	 * @param {Dimensions} dimensionId - The dimension ID of the region.
	 * @param {IRegionPermissions} [permissions] - An object containing the permissions for the region.
	 * @param {string} [key] - The key of the region. This is used to identify the region.
	 */
	constructor(dimensionId, permissions, key) {
		this.dimensionId = dimensionId;
		this.permissions = permissions ?? Region.CONFIG.PERMISSIONS;
		this.key = key ?? new Date(Date.now()).toISOString();
	}
	/**
	 * Checks if vector is in region
	 * @param {Vector3} vector
	 */
	vectorInRegion(vector) {
		// Actual implementation in extended class
		return false;
	}
	/**
	 * Updates this region in the database
	 */
	update() {}
	/**
	 * Removes this region
	 */
	delete() {
		Region.REGIONS = Region.REGIONS.filter((e) => e.key !== this.key);
		TABLE.delete(this.key);
	}
	/**
	 * A function that will loop through all the owners
	 * of a region and call the callback function on each
	 * of them.
	 * @param {(player: Player, index: number, array: Player[]) => void | Promise<void>} callback - Callback to run
	 */
	forEachOwner(callback) {
		if (!Array.isArray(this.permissions.owners)) return;
		this.permissions.owners
			.map(XEntity.fetch)
			.filter((e) => e)
			.forEach((player, i, owners) =>
				util.handle(() => callback(player, i, owners), "Region.forEachOwner")
			);
	}
}

export class CubeRegion extends Region {
	/**
	 * Gets all cube regions
	 * @returns {CubeRegion[]}
	 */
	static getAllRegions() {
		// @ts-expect-error
		return Region.getAllRegions().filter((e) => e instanceof CubeRegion);
	}
	/**
	 * @param {Vector3} blockLocation
	 * @param {string} dimensionId
	 * @returns {CubeRegion | undefined}
	 */
	static blockLocationInRegion(blockLocation, dimensionId) {
		const region = this.getAllRegions().find(
			(region) =>
				region.dimensionId === dimensionId &&
				region.vectorInRegion(blockLocation)
		);

		if (region instanceof CubeRegion) return region;
	}
	/** @type {IRegionCords} */
	from;
	/** @type {IRegionCords} */
	to;
	/**
	 * Creates a new region
	 * @param {IRegionCords} from - The position of the first block of the region.
	 * @param {IRegionCords} to - The position of the region's end.
	 * @param {Dimensions} dimensionId - The dimension ID of the region.
	 * @param {IRegionPermissions} [permissions] - An object containing the permissions for the region.
	 * @param {string} [key] - The key of the region. This is used to identify the region.
	 * @param {boolean} [creating] - Whether or not the region is being created.
	 */
	constructor(from, to, dimensionId, permissions, key, creating = true) {
		super(dimensionId, permissions, key);
		this.from = from;
		this.to = to;

		if (creating) {
			this.update();
			Region.REGIONS.push(this);
		}
	}
	/** @param {Vector3} vector */
	vectorInRegion(vector) {
		return Vector.between(
			{ x: this.from.x, y: LOWEST_Y_VALUE, z: this.from.z },
			{ x: this.to.x, y: HIGEST_Y_VALUE, z: this.to.z },
			vector
		);
	}
	update() {
		TABLE.set(this.key, {
			t: "c",
			key: this.key,
			from: this.from,
			dimensionId: this.dimensionId,
			permissions: this.permissions,
			to: this.to,
		});
	}
}

TABLE.on("beforeGet", (key, value) => {
	value = DB.setDefaults(value, {
		dimensionId: "overworld",
		permissions: Region.CONFIG.PERMISSIONS,
		key,
	});
	return value;
});
TABLE.on("beforeSet", (key, value) => {
	return DB.removeDefaults(value, {
		dimensionId: "overworld",
		permissions: Region.CONFIG.PERMISSIONS,
		key,
	});
});

export class RadiusRegion extends Region {
	/**
	 * Gets all cube regions
	 * @returns {RadiusRegion[]}
	 */
	static getAllRegions() {
		// @ts-expect-error
		return Region.getAllRegions().filter((e) => e instanceof RadiusRegion);
	}
	/** @type {Vector3} */
	center;
	/** @type {number} */
	radius;
	/**
	 * Creates a new region
	 * @param {Vector3} center - The position of the first block of the region.
	 * @param {number} radius - The position of the region's end.
	 * @param {Dimensions} dimensionId - The dimension ID of the region.
	 * @param {IRegionPermissions} [permissions] - An object containing the permissions for the region.
	 * @param {string} [key] - The key of the region. This is used to identify the region.
	 * @param {boolean} [creating] - Whether or not the region is being created.
	 */
	constructor(center, radius, dimensionId, permissions, key, creating = true) {
		super(dimensionId, permissions, key);
		this.center = center;
		this.radius = radius;

		if (creating) {
			this.update();
			Region.REGIONS.push(this);
		}
	}
	/**
	 *
	 * @param {Vector3} vector
	 */
	vectorInRegion(vector) {
		return Vector.distance(this.center, vector) < this.radius;
	}
	/**
	 * Updates this region in the database
	 * @returns {void}
	 */
	update() {
		TABLE.set(this.key, {
			t: "r",
			key: this.key,
			center: this.center,
			dimensionId: this.dimensionId,
			permissions: this.permissions,
			radius: this.radius,
		});
	}
}

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

new XCommand({
	name: "region",
	role: "admin",
	type: "server",
})
	.literal({ name: "create" })
	.int("radius")
	.executes((ctx, radius) => {
		const reg = new RadiusRegion(
			Vector.floor(ctx.sender.location),
			radius,
			ctx.sender.dimension.type
		);
		reg.update();
		ctx.reply("Created with radius " + radius);
	});
