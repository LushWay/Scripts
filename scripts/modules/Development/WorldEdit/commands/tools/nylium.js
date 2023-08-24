import { EquipmentSlot, MinecraftBlockTypes, world } from "@minecraft/server";
import { ModalForm } from "xapi.js";
import { WorldEditTool } from "../../builders/ToolBuilder.js";
import { setblock } from "../../utils/utils.js";
import { getBlockSet, getBlockSets } from "../general/menu.js";

const nylium = new WorldEditTool({
	name: "nylium",
	displayName: "слуйчайный блок из набора",
	itemStackId: MinecraftBlockTypes.warpedNylium.id,
	loreFormat: {
		version: 1,

		blocksSet: "",
	},
	editToolForm(slot, player) {
		const lore = nylium.parseLore(slot.getLore());
		new ModalForm("§3" + this.displayName)
			.addDropdown(
				"Набор блоков",
				...ModalForm.arrayAndDefault(
					Object.keys(getBlockSets(player)),
					lore.blocksSet
				)
			)
			.show(player, (_, blocksSet) => {
				lore.blocksSet = blocksSet;
				slot.setLore(nylium.stringifyLore(lore));
				player.tell("§3> §fНабор блоков сменен на " + blocksSet);
			});
	},
});

/* Replaces the block with a random block from the lore of the item. */
world.afterEvents.blockPlace.subscribe(({ block, player }) => {
	if (block.typeId !== nylium.item) return;

	const slot = player
		.getComponent("equipment_inventory")
		.getEquipmentSlot(EquipmentSlot.mainhand);
	const blocksSets = getBlockSets(player);
	const name = nylium.parseLore(slot.getLore())?.blocksSet;

	if (name in blocksSets) {
		setblock(getBlockSet(blocksSets, name).randomElement(), block.location);
	} else {
		player.tell("§cНеизвестный набор блоков! Выберите существующий из списка");
		nylium.editToolForm(slot, player);
	}
});
