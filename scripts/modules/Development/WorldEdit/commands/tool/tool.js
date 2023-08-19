import { ItemStack, Player } from "@minecraft/server";
import { ActionForm, ModalForm, XEntity } from "xapi.js";
import { ListParticles } from "../../../../../lib/List/particles.js";
import { ListSounds } from "../../../../../lib/List/sounds.js";

new XCommand({
	name: "tool",
	role: "moderator",
	type: "wb",
}).executes((ctx) => {
	const item = XEntity.getHeldItem(ctx.sender);
	if (!item || item.typeId !== "we:tool")
		return ctx.reply(`§cВ руках должен быть we:tool!`);

	loreForm(item, ctx.sender);
});

/**
 *
 * @param {ItemStack} item
 * @param {Player} player
 */
function loreForm(item, player) {
	let lore = item.getLore();
	const saveItem = () => {
		item.setLore(lore);
		player
			.getComponent("inventory")
			.container.setItem(player.selectedSlot, item);
	};
	new ActionForm(
		"§3Инструмент",
		"Настройте что будет происходить при использовании этого предмета."
	)
		.addButton("Телепорт по взгляду", null, () => {
			item.nameTag = `§r§a► Телепорт по взгляду`;
			lore[0] = "teleportToView";

			saveItem();
			player.tell(`§a► §rРежим инструмента изменен на телепорт по взгляду`);
		})
		.addButton("Выполнение команды", null, () => {
			new ModalForm("§3Инструмент")
				.addTextField("Команда", "/tp @s ^^^5")
				.show(player, (_, command) => {
					if (command.startsWith("/")) command = command.substring(1);

					item.nameTag = `§r§aR► §f${command}`;
					lore[0] = "runCommand";
					lore[1] = command;

					saveItem();
					player.tell(`§aR► §fКоманда: §7${command}`);
				});
		})
		.addButton("Проверка звуков", null, () => {
			SelectFromArray(ListSounds, "§3Звук", (sound, index) => {
				item.nameTag = `§3Звук`;
				lore[0] = "Sound";
				lore[1] = sound;
				lore[2] = index.toString();

				saveItem();
				player.tell(`§aR► §fЗвук: §7${index} ${sound}`);
			});
		})
		.addButton("Проверка партиклов", null, () => {
			SelectFromArray(ListParticles, "§3Партикл", (particle, index) => {
				item.nameTag = `§3Партикл`;
				lore[0] = "Particle";
				lore[1] = particle;
				lore[2] = index.toString();

				saveItem();
				player.tell(`§aR► §fПартикл: §7${index} ${particle}`);
			});
		})
		.show(player);

	/**
	 *
	 * @param {string[]} array
	 * @param {string} name
	 * @param {(element: string, index: number) => void} callback
	 */
	function SelectFromArray(array, name, callback) {
		const none = "Никакой";
		new ModalForm(name)
			.addDropdown("Из списка", [none, ...array], 0)
			.addTextField("ID Текстом", "Будет выбран из списка выше")
			.show(player, (ctx, list, text) => {
				let element;
				let index;
				if (list === none) {
					if (!element) return ctx.error("Выберите из списка или ввиде id!");
					element = text;
					index = array.indexOf(element);
					if (!index)
						return ctx.error(
							"Неизвестный id! Убедитесь что имя начинается с minecraft:"
						);
				} else {
					element = list;
					index = array.indexOf(element);
				}

				callback(element, index);
			});
	}
}
