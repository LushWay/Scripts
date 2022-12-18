import { ActionForm } from "../../lib/Form/ActionForm.js";
import { JOIN_EVENTS } from "./events.js";
import { shortTime, timeNow } from "./var.js";

JOIN_EVENTS.playerJoin.subscribe((player) => {
	player.tell(`${timeNow()}, §b§l${player.name}!\n§r§9Время • ${shortTime()}`);
}, -1);

JOIN_EVENTS.playerGuide.subscribe((player) => {
	new ActionForm(
		"Краткий гайд",
		`  ${timeNow()}, ${
			player.name
		}!\n  §7Для навигации по серверу используется §fменю§7 (зачарованный алмаз в инвентаре). Что бы открыть меню, возьми его в руку и §fиспользуй§7 (зажми на телефоне, ПКМ на пк)\n\n  Помимо него есть еще кастомные §fкоманды§7. Все они вводятся в чат и должны начинаться с '§f-§7'.\n  Что бы получить список всех доступных команд пропиши в чат §f-help§7.\n\n\n `
	)
		.addButton("Oк!", null, () => {})
		.show(player);
}, -1);
