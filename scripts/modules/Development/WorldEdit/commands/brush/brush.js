import { ItemStack, ItemTypes, Player } from "@minecraft/server";

import { ModalForm } from "xapi.js";
import { SHAPES } from "../../utils/shapes.js";

new XCommand({
	name: "brush",
	description: "Создает/редактирует кисть",
	role: "moderator",
	type: "wb",
}).executes((ctx) => {
	const slot = ctx.sender
		.getComponent("inventory")
		.container.getSlot(ctx.sender.selectedSlot);
	const data = {
		save: () => slot.setItem(data.item),
		item: slot.getItem(),
	};

	if (data.item && data.item.typeId !== "we:brush")
		return ctx.error(
			"Возьми кисть в руки для настройки или выбери пустой слот чтобы создать ее!"
		);

	if (!data.item) {
		data.item = new ItemStack(ItemTypes.get(`we:brush`));
		data.save();
	}

	brushForm(data, ctx.sender);
});

/**
 *
 * @param {{item: ItemStack, save: () => void}} data
 * @param {Player} player
 */
function brushForm(data, player) {
	const oldlore = data.item.getLore();
	const oldshape = oldlore[0]?.split(" ")?.[1] ?? "sphere";
	const oldblocks = oldlore[1]?.split(" ")?.[1];
	const oldsize = Number(oldlore[2]?.split(" ")?.[1]);

	const shapes = Object.keys(SHAPES);

	new ModalForm("§3Кисть")
		.addDropdown(
			"Форма",
			shapes,
			shapes.findIndex((e) => e === oldshape)
		)
		.addSlider("Размер", 1, 10, 1, isNaN(oldsize) ? 1 : oldsize)
		.addTextField("Блоки", "stone.4,planks.1", oldblocks ? oldblocks : null)
		.show(player, (ctx, shape, size, blocks) => {
			if (!SHAPES[shape]) return ctx.error("§c" + shape);
			data.item.nameTag = "§r§6" + shape;
			data.item.setLore([
				`Shape: ${shape}`,
				`Blocks: ${blocks}`,
				`Size: ${size}`,
				`Range: 300`,
			]);
			data.save();
			player.tell(
				`§a► §r${
					oldblocks ? "Отредактирована" : "Создана"
				} кисть ${shape} с ${blocks} блоками и размером ${size}`
			);
		});
}
