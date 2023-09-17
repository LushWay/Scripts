import {
	Block,
	Entity,
	ItemStack,
	MinecraftBlockTypes,
	Player,
} from "@minecraft/server";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { XShowForm } from "../Form/utils.js";
import { untyped_terrain_textures } from "../List/terrain-textures.js";
import { inaccurateSearch } from "./Search.js";
import { Module } from "./OptionalModules.js";

const blocks = Object.values(MinecraftBlockTypes).map((e) => e.id);

const itemTypes = ["boat", "banner_pattern"];
const itemRegExp = new RegExp(`^(.+)_(${itemTypes.join("|")})`);

/** @type {((s: string) => string | undefined)[]} */
const itemModifiers = [
	(spawn_egg) => {
		const match = spawn_egg.match(/^(.+)_spawn_egg$/);
		if (!match) return;
		return `spawn_egg.entity.${match[1]}`;
	},
	(chest_boat) => {
		const match = chest_boat.match(/^(.+)_chest_boat$/);
		if (!match) return;
		return `chest_boat.${match[1]}`;
	},
	(id) => {
		if (id.includes(".")) return;
		const match = id.match(itemRegExp);
		if (!match) return;
		const [, color, type] = match;
		return `${type}.${color}`;
	},
	(dark_oak) => {
		if (dark_oak.includes("dark_oak") && dark_oak !== "dark_oak_door")
			return dark_oak.replace("dark_oak", "big_oak");
	},
];
/** @type {((s: string) => string)[]} */
const afterItems = [(s) => s.replace(/\.name$/, "")];

const blockTypes = ["wool"];
const blockRegExp = new RegExp(`^(.+)_(${blockTypes.join("|")})`);

/** @type {((s: string) => string | undefined)[]} */
const blockModifiers = [
	(id) => {
		if (id === "cobblestone_wall") return `cobblestone_wall.normal`;
	},
	(id) => {
		if (id.includes(".")) return;
		const match = id.match(blockRegExp);
		if (!match) return;
		const [, color, type] = match;
		return `${type}.${color}`;
	},
];

export const GameUtils = {
	/**
	 * @param {string} name
	 * @returns {undefined | string}
	 */
	env(name) {
		if (Module.ServerAdmin) {
			return Module.ServerAdmin.variables.get(name);
		}
	},
	/**
	 *
	 * @param {ItemStack} item
	 */
	localizationName(item) {
		let id = item.typeId.replace("minecraft:", "");
		if (blocks.includes(item.typeId)) {
			for (const fn of blockModifiers) {
				const result = fn(id);
				id = result ?? id;
			}

			return `%tile.${id}.name`;
		}

		for (const fn of itemModifiers) {
			const result = fn(id);
			id = result ?? id;
		}

		let name = `%item.${id}.name`;
		for (const fn of afterItems) name = fn(name) ?? name;

		return name;
	},
	/**
	 * @param {Player} player
	 * @returns {Promise<Block | ItemStack | false>}
	 */
	selectBlock(player) {
		/** @type {Array<Block | ItemStack | 'buffer'>} */
		const blocks = [];

		/**
		 * @type {ActionFormData & { buffer?: ActionFormData["button"]; }}
		 */
		const form = new ActionFormData();

		const nativeAddButton = form.button.bind(form);
		form.buffer = (text, iconPath) => {
			blocks.push("buffer");
			nativeAddButton(text, iconPath);
			return form;
		};
		form.button = (text, iconPath) => {
			nativeAddButton(text, iconPath);
			return form;
		};

		form.title("Выбери блок");
		const underfeat = player.location;
		underfeat.y--;
		const underfeatBlock = player.dimension.getBlock(underfeat);

		if (underfeatBlock && underfeatBlock.typeId !== "minecraft:air") {
			const id = underfeatBlock.typeId.replace(/^minecraft:/, "");
			form.buffer("Блок под ногами");

			form.button(id, this.getBlockTexture(id));
			blocks.push(underfeatBlock);
		}

		form.buffer("Инвентарь");

		const inventory = player.getComponent("inventory").container;
		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (!item || !MinecraftBlockTypes.get(item.typeId)) continue;
			const id = item.typeId.replace(/^minecraft:/, "");
			form.button(id, this.getBlockTexture(id));
			blocks.push(item);
		}

		return new Promise(async (resolve) => {
			const result = await XShowForm(form, player);
			if (
				result === false ||
				!(result instanceof ActionFormResponse) ||
				!result.selection
			)
				return resolve(false);

			const selectedBlock = blocks[result.selection];

			if (selectedBlock === "buffer")
				return resolve(await this.selectBlock(player));
			resolve(selectedBlock);
		});
	},
	/**
	 * @param {string} id
	 */
	getBlockTexture(id) {
		id = id.replace(/^minecraft:/, "");
		const search = inaccurateSearch(id, Object.keys(untyped_terrain_textures));
		const textures = untyped_terrain_textures[search[0][0]].textures;

		return Array.isArray(textures) ? textures[0] : textures;
	},
	/**
	 * Sometimes entity.typeId throws
	 * @param {Entity} entity
	 * @returns
	 */
	safeGetTypeID(entity) {
		try {
			return entity.typeId;
		} catch (e) {
			return undefined;
		}
	},
};
