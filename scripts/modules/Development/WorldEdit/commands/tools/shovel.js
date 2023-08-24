import { ModalForm } from "xapi.js";
import { WorldEditTool } from "../../builders/ToolBuilder.js";
import { getBlockSets } from "../general/menu.js";

const shovel = new WorldEditTool({
	name: "shovel",
	displayName: "лопата",
	loreFormat: {
		version: 1,

		blocksSet: "",
		height: 1,
		radius: 2,
	},
	itemStackId: "we:shovel",
	editToolForm(slot, player) {
		const lore = shovel.parseLore(slot.getLore());
		new ModalForm("§3Лопата")
			.addSlider("Радиус", 1, 10, 1, lore.radius ?? 1)
			.addSlider("Высота", 1, 10, 1, lore.radius ?? 1)
			.addDropdown(
				"Набор блоков",
				...ModalForm.arrayAndDefault(
					Object.keys(getBlockSets(player)),
					lore.blocksSet
				)
			)
			.show(player, (_, radius, height, blocksSet) => {
				slot.nameTag = `§r§3Лопата §6${blocksSet}`;
				lore.radius = radius;
				lore.height = height;
				lore.blocksSet = blocksSet;
				slot.setLore(shovel.stringifyLore(lore));

				player.tell(
					`§a► §r${
						lore.blocksSet ? "Отредактирована" : "Создана"
					} лопата с ${blocksSet} набором блоков и радиусом ${radius}`
				);
			});
	},
	onUse(_, item) {
		const lore = item.getLore();
		if (lore[0] === "§aEnabled") {
			lore[0] = "§cDisabled";
		} else lore[0] = "§aEnabled";

		item.setLore(lore);
	},
});
