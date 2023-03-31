import { ItemStack, ItemTypes } from "@minecraft/server";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { JOIN_EVENTS, __JOIN_EMITTERS } from "./events.js";
import { shortTime, timeNow } from "./var.js";

JOIN_EVENTS.playerJoin.subscribe((player) => {
	player.tell(`${timeNow()}, ${player.name}!\n§r§3Время §b• §3${shortTime()}`);
}, -1);

JOIN_EVENTS.playerGuide.subscribe((player) => {
	new ActionForm(
		"Краткий гайд",
		`  ${timeNow()}, ${
			player.name
		}!\n  §7Основные функции сервера находятся в §fменю§7 - зачарованном алмазе в инвентаре.§7 Чтобы открыть меню, возьми его в руку и §fиспользуй§7 его - зажми на телефоне, ПКМ на пк\n\n  §7Что бы просмотреть доступные кастомные команды напиши в чат '§f-help§7'.\n\n\n `
	)
		.addButton("Oк!", null, () =>
			__JOIN_EMITTERS.PlayerClosedGuide.emit(player)
		)
		.show(player);
}, -1);

JOIN_EVENTS.playerClosedGuide.subscribe((p) => {
	p.getComponent("inventory").container.addItem(
		new ItemStack(ItemTypes.get("xa:menu"))
	);
});

