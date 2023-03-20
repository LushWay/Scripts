import { Player, world } from "@minecraft/server";
import { DisplayError, getRole, T_roles, XA } from "xapi.js";
import { CONFIG } from "../../config.js";

const options = XA.WorldOptions("chat", {
	cooldown: {
		desc: "Задержка, 0 что бы отключить",
		value: CONFIG.chat.cooldown,
	},
	range: {
		desc: "Радиус для затемнения сообщений дальних игроков",
		value: CONFIG.chat.range,
	},
	ranks: { desc: "Ранги в чате", value: false },
});

const playerOptions = XA.PlayerOptions("chat", {
	hightlightMessages: {
		desc: "Если включено, вы будете видеть свои сообщения в чате так: §l§6Я: §r§fСообщение§r",
		value: true,
	},
	disableSound: { desc: "", value: false },
});

world.events.beforeChat.subscribe((data) => {
	if (data.message.startsWith(CONFIG.commandPrefix)) return;
	data.cancel = true;
	try {
		const cooldown = options.cooldown;

		if (cooldown && cooldown > Date.now()) {
			const time = XA.Cooldown.getRemainingTime(cooldown - Date.now());
			return data.sender.tell(
				`§c► Подожди еще §b${time.parsedTime}§c ${time.type}`
			);
		}

		const pR = getRole(data.sender);

		let role = "";
		if (!options.ranks && pR !== "member") role = T_roles[pR];

		const allPlayers = world.getAllPlayers();

		// Sound!
		for (const p of allPlayers.filter((e) => !playerOptions(e).disableSound))
			p.playSound("note.hat");

		const nearPlayers = [
			...data.sender.dimension.getEntities({
				location: data.sender.location,
				maxDistance: options.range,
				type: "minecraft:player",
			}),
		].filter((e) => e.id !== data.sender.id);

		const nID = nearPlayers.map((e) => e.id);
		nID.push(data.sender.id);

		// Outranged players
		const otherPlayers = allPlayers.filter((e) => !nID.includes(e.id));

		for (const n of nearPlayers)
			if (n instanceof Player)
				n.tell(`${role}§7${data.sender.name}§r: ${data.message}`);

		for (const o of otherPlayers)
			o.tell(`${role}§8${data.sender.name}§7: ${data.message}`);

		const hightlight = playerOptions(data.sender).hightlightMessages;
		data.sender.tell(
			!hightlight
				? `${role ? role + " " : ""}§7${data.sender.name}§r: ${data.message}`
				: `§6§lЯ§r: §f${data.message.replace(/\\n/g, "\n")}`
		);
	} catch (error) {
		DisplayError(error);
	}
});
