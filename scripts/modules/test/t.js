import { Player, world, system } from "@minecraft/server";
import {
	ActionFormData,
	MessageFormData,
	ModalFormData,
} from "@minecraft/server-ui";
const gui = new ActionFormData();
gui.title("§l§bМеню§r");
// gui.body("§l§fHere are all functions you can use in this gui§r");
gui.button("§lНовая платформа§r\n§4! §7Текущая уйдет в архив §4!§r");
gui.button("§lТелепортироваться§r");
gui.button("§l§cУдалить§r");

const gui2 = new ActionFormData();
gui2.title("§l§bNew Menu§r");
gui2.body("§l§fAnother gui page§r");
gui2.button("§l§aGive compass§r", "textures/ui/plus.png");

world.events.beforeItemUse.subscribe(async (data) => {
	const source = data.source;
	if (source instanceof Player && data.item.typeId === "minecraft:compass") {
		const result = await gui.show(source);
		if (result.canceled) return console.warn("GUI was canceled");
		if (result.selection === 0) {
			const r = await gui2.show(source);
			console.warn(r.selection);
			if (r.selection === 0) {
				source.runCommand("give @s compass");
			}
		}
	}
});
