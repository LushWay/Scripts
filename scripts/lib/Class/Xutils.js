import {
	Block,
	BlockLocation,
	BoolBlockProperty,
	IntBlockProperty,
	MinecraftBlockTypes,
	Player,
	StringBlockProperty,
} from "@minecraft/server";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { ThrowError } from "../../xapi.js";
import { XShowForm } from "../Form/utils.js";
import { untyped_terrain_textures } from "../List/terrain-textures.js";
import { inaccurateSearch } from "./Search.js";

export const XUtils = {
	/**
	 *
	 * @template T
	 * @param {Vector3} loc1
	 * @param {Vector3} loc2
	 * @param {EX<T, boolean>} convert
	 * @returns {Generator<T extends true ? BlockLocation : Vector3, void, unknown>}
	 */
	*safeBlocksBetween(loc1, loc2, convert) {
		try {
			const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
			const [xmin, xmax] = minmax(loc1.x, loc2.x);
			const [zmin, zmax] = minmax(loc1.z, loc2.z);
			const [ymin, ymax] = minmax(loc1.y, loc2.y);
			for (let x = xmin; x <= xmax; x++) {
				for (let z = zmin; z <= zmax; z++) {
					for (let y = ymin; y <= ymax; y++) {
						// @ts-expect-error
						if (convert) yield new BlockLocation(x, y, z);
						// @ts-expect-error
						else yield { x, y, z };
					}
				}
			}
		} catch (e) {
			ThrowError(e);
		}
	},
	/**
	 *
	 * @param {Vector3} loc1
	 * @param {Vector3} loc2
	 */
	getBlocksCount(loc1, loc2) {
		const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
		const [xmin, xmax] = minmax(loc1.x, loc2.x);
		const [zmin, zmax] = minmax(loc1.z, loc2.z);
		const [ymin, ymax] = minmax(loc1.y, loc2.y);
		const x = xmax - xmin + 1;
		const y = ymax - ymin + 1;
		const z = zmax - zmin + 1;
		return x * y * z;
	},
	/**
	 * Converts a location to a block location
	 * @param {Vector3} loc a location to convert
	 * @returns {BlockLocation}
	 */
	vecToBlockLocation(loc) {
		return new BlockLocation(Math.floor(loc.x), Math.floor(loc.y), Math.floor(loc.z));
	},
	/**
	 * Returns the block data of a block.
	 * @param {Block} block - Block to get data
	 * @returns {number} Data
	 */
	getBlockData(block) {
		const allProperies = block.permutation.getAllProperties();
		const needProps = allProperies.filter((p) => "validValues" in p);

		/** @type {StringBlockProperty | IntBlockProperty} */
		// @ts-expect-error
		const main = needProps.find((e) => typeof e.value === "string" || typeof e.value === "number");

		/** @type {BoolBlockProperty} */
		// @ts-expect-error
		const bit = needProps.find((e) => typeof e.value === "boolean");

		const data = main?.validValues?.findIndex((e) => e === main.value);

		// Cannot find property...
		if (!data) return 0;
		if (bit.value) return data + main.validValues.length;
		else return data;
	},
	/**
	 *
	 * @param {Player} player
	 */
	selectBlock(player) {
		/** @type {[string, number][]} */
		const blocks = [];

		/**
		 * @type {ActionFormData & {
		 *   buffer?: ActionFormData["button"];
		 * }}
		 */
		const form = new ActionFormData();
		form.title("Выбери блок");

		const addButton = this.TypedBind(form.button, form);
		form.buffer = (text, iconPath) => {
			blocks.push(["buffer", 0]);

			addButton(text, iconPath);
			return form;
		};

		form.button = (text, iconPath) => {
			addButton(text, iconPath);
			return form;
		};

		const underfeatBlock = player.dimension.getBlock(this.vecToBlockLocation(player.location).offset(0, -1, 0));

		if (underfeatBlock && underfeatBlock.typeId !== "minecraft:air") {
			const id = underfeatBlock.typeId.replace(/^minecraft:/, "");
			const data = this.getBlockData(underfeatBlock);
			form.buffer("Блок под ногами");

			form.button(`${id}${data > 0 ? ` ${data}` : ""}`, this.getBlockTexture(id, data));
			blocks.push([id, data]);
		}

		form.buffer("Инвентарь");

		const inventory = player.getComponent("inventory").container;
		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (!item || !MinecraftBlockTypes.get(item.typeId)) continue;
			const id = item.typeId.replace(/^minecraft:/, "");
			const data = item.data;
			form.button(`${id}${data > 0 ? ` ${data}` : ""}`, this.getBlockTexture(id, data));
			blocks.push([id, data]);
		}

		return new Promise(async (resolve) => {
			const result = await XShowForm(form, player);
			if (result === false || !(result instanceof ActionFormResponse)) return false;

			const selectedBlock = blocks[result.selection];

			if (selectedBlock[0] === "buffer") resolve(await this.selectBlock(player));

			resolve(selectedBlock);
		});
	},
	/**
	 * @param {string} id
	 * @param {number} data
	 */
	getBlockTexture(id, data) {
		id = id.replace(/^minecraft:/, "");
		const search = inaccurateSearch(id, Object.keys(untyped_terrain_textures));
		const textures = untyped_terrain_textures[search[0][0]].textures;

		let path;
		if (!Array.isArray(textures)) {
			path = textures;
		} else {
			path = textures[data] ?? textures[0];
		}
		return path;
	},
	/**
	 * @template Func, [This = any]
	 * @param {Func} func
	 * @param {This} context
	 * @returns {Func}
	 */
	TypedBind(func, context) {
		if (typeof func !== "function") return func;
		return func.bind(context);
	},
};
