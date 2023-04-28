import { world } from "@minecraft/server";
import { Database } from "lib/Database/Rubedo.js";
import { DisplayError, getRole, ROLES_NAMES, XA } from "xapi.js";
import { CONFIG } from "../../../config.js";

const OPTIONS = XA.WorldOptions("chat", {
	cooldown: {
		name: "Задержка",
		desc: "0 что бы отключить",
		value: 0,
	},
	range: {
		name: "Радиус",
		desc: "Радиус для затемнения сообщений дальних игроков",
		value: 30,
	},
	ranks: { desc: "Ранги в чате", value: false, name: "Ранги" },
});

const COOLDOWN_DB = new Database("chat");

const PLAYER_OPTIONS = XA.PlayerOptions("Чат", "chat", {
	hightlightMessages: {
		name: "Подсветка моих сообщений",
		desc: "Если включено, вы будете видеть свои сообщения в чате так: §l§6Я: §r§fСообщение§r",
		value: true,
	},
	disableSound: { desc: "", value: false, name: "Выключение звука" },
});

world.afterEvents.chatSend.subscribe((data) => {
	if (
		data.message.startsWith(CONFIG.commandPrefix) &&
		data.message !== CONFIG.commandPrefix
	)
		return;

	try {
		const cooldown = OPTIONS.cooldown;

		// Is cooldown enabled?
		if (cooldown) {
			const cool = new XA.Cooldown(COOLDOWN_DB, "CLDW", data.sender, cooldown);

			if (cool.statusTime !== "EXPIRED") {
				// Player is under chat cooldown, show error message
				const time = XA.Cooldown.getRemainingTime(cooldown - Date.now());
				return data.sender.tell(
					`§c► Подожди еще §b${time.parsedTime}§c ${time.type}`
				);
			}
		}

		const playerRole = getRole(data.sender);

		let role = "";
		if (OPTIONS.ranks && playerRole !== "member")
			role = ROLES_NAMES[playerRole];

		const allPlayers = world.getAllPlayers();

		// Players that are near message sender
		const nearPlayers = data.sender.dimension
			.getPlayers({
				location: data.sender.location,
				maxDistance: OPTIONS.range,
			})
			.filter((e) => e.id !== data.sender.id);

		// Array with ranged players (include sender id)
		const nID = nearPlayers.map((e) => e.id);
		nID.push(data.sender.id);

		// Outranged players
		const otherPlayers = allPlayers.filter((e) => !nID.includes(e.id));

		for (const n of nearPlayers) {
			n.tell(`${role}§7${data.sender.name}§r: ${data.message}`);

			if (!PLAYER_OPTIONS(n).disableSound) n.playSound("note.hat");
		}

		for (const o of otherPlayers)
			o.tell(`${role}§8${data.sender.name}§7: ${data.message}`);

		const hightlight = PLAYER_OPTIONS(data.sender).hightlightMessages;
		data.sender.tell(
			!hightlight
				? `${role ? role + " " : ""}§7${data.sender.name}§r: ${data.message}`
				: `§6§lЯ§r: §f${data.message.replace(/\\n/g, "\n")}`
		);
	} catch (error) {
		DisplayError(error);
	}
});
