import { Block, MinecraftBlockTypes, Player } from "@minecraft/server";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { XShowForm } from "../Form/utils.js";
import { untyped_terrain_textures } from "../List/terrain-textures.js";
import { inaccurateSearch } from "./Search.js";

export const XUtils = {
	/**
	 * @param {string | symbol | number} str
	 * @param {{[]: any}} obj
	 * @returns {str is keyof obj}
	 */
	isKeyof(str, obj) {
		return str in obj;
	},
	/**
	 *
	 * @param {Player} player
	 */
	selectBlock(player) {
		/** @type {string[]} */
		const blocks = [];

		/**
		 * @type {ActionFormData & { buffer?: ActionFormData["button"]; }}
		 */
		const form = new ActionFormData();

		const nativeAddButton = form.button.typedBind(form);
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
			blocks.push(id);
		}

		form.buffer("Инвентарь");

		const inventory = player.getComponent("inventory").container;
		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (!item || !MinecraftBlockTypes.get(item.typeId)) continue;
			const id = item.typeId.replace(/^minecraft:/, "");
			form.button(id, this.getBlockTexture(id));
			blocks.push(id);
		}

		return new Promise(async (resolve) => {
			const result = await XShowForm(form, player);
			if (result === false || !(result instanceof ActionFormResponse))
				return false;

			const selectedBlock = blocks[result.selection];

			if (selectedBlock[0] === "buffer")
				resolve(await this.selectBlock(player));

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

		return textures[0];
	},
};


