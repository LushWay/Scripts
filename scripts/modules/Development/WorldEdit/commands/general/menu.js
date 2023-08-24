import {
	MinecraftBlockTypes,
	MinecraftItemTypes,
	Player,
} from "@minecraft/server";
import { ActionForm, Database, ModalForm, XShowForm } from "xapi.js";
import { ChestFormData } from "../../../../../chestui/forms.js";
import { WorldEditTool } from "../../builders/ToolBuilder.js";

/**
 * @typedef {Record<string, [string, number][]>} BlocksSets
 */

/** @type {Database<string, BlocksSets | undefined>} */
const DB = new Database("worldEditBlockSets");

/** @type {BlocksSets} */
const defaultBlockSets = {
	"Пещерный камень": [
		[MinecraftBlockTypes.stone.id, 0],
		[MinecraftBlockTypes.cobblestone.id, 0],
	],
	"Каменная стена": [[MinecraftBlockTypes.stonebrick.id, 1]],
};

/**
 * @param {Player} player
 * @returns {BlocksSets}
 */
export function getBlockSets(player) {
	const playerBlockSets = DB.get(player.id) ?? {};
	return { ...defaultBlockSets, ...playerBlockSets };
}

/**
 * @param {BlocksSets} sets
 * @param {string} name
 */
export function getBlockSet(sets, name) {
	const blocks = sets[name];
	if (!blocks) return [];
	return blocks.map((e) => e.join("."));
}

new XCommand({
	name: "we",
	role: "builder",
	description: "Открывает меню редактора мира",
}).executes((ctx) => WBMenu(ctx.sender));

/**
 * @param {Player} player
 */
function WBMenu(player, body = "") {
	const form = new ActionForm("§5World§6Edit", body).addButton(
		"Наборы блоков",
		() => {
			const blockSets = getBlockSets(player);
			const sets = new ActionForm("Наборы блоков");
			sets.addButton("Назад", () => form.show(player));
			sets.addButton("Новый набор блоков", "textures/items/sum.png", () => {
				new ModalForm("§3Имя")
					.addTextField(
						`Существующие наборы:\n${Object.keys(blockSets).join(
							"\n"
						)}\n\nВведи новое имя набора`,
						""
					)
					.show(player, (ctx, name) => {
						if (name in blockSets)
							return ctx.error("Набор с именем " + name + " уже существует!");

						editBlocksSet(player, name, blockSets);
					});
			});
			for (const key of Object.keys(blockSets)) {
				sets.addButton(key, () => editBlocksSet(player, key, blockSets));
			}
			sets.show(player);
		}
	);

	for (const tool of WorldEditTool.TOOLS) {
		form.addButton(tool.getMenuButtonName(player), () => {
			const slotOrError = tool.getToolSlot(player);
			if (typeof slotOrError === "string") {
				WBMenu(player, '§c' + slotOrError);
			} else {
				tool.editToolForm(slotOrError, player);
			}
		});
	}

	form.show(player);
}

/**
 * @param {Player} player
 * @param {string} setName
 * @param {BlocksSets} sets
 * @param {"inventory" | "see" | "edit"} mode
 */
function editBlocksSet(player, setName, sets, mode = "see") {
	if (!(setName in sets)) mode = "inventory";

	const form = new ChestFormData("large");
	form.pattern(
		[0, 0],
		[
			"xxxxOxxxx",
			"---------",
			"---------",
			"---------",
			"---------",
			"---------",
			"xxxxxxxxx",
		],
		{
			x: { iconPath: MinecraftBlockTypes.stainedGlassPane.id, data: {} },
			O: { iconPath: MinecraftItemTypes.arrow.id, data: {} },
		}
	);

	if (mode === "inventory") {
		const { container } = player.getComponent("inventory");

		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);
			if (item) {
				form.button(
					9 + i,
					item.typeId.replace("minecraft:", ""),
					[],
					item.typeId
				);
			}
		}
	} else {
	}

	XShowForm(form, player).then((e) => {
		console.debug(e);
	});
}
