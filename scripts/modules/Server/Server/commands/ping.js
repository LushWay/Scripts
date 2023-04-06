import { system } from "@minecraft/server";
import { XA } from "xapi.js";

/**
 *
 * @returns {Promise<number>}
 */
async function getServerTPS() {
	let startTime = Date.now();
	let ticks = 0;
	return new Promise((resolve) => {
		system.run(function tick() {
			if (Date.now() - startTime < 1000) {
				ticks++;
				system.run(tick);
			} else {
				resolve(ticks);
			}
		});
	});
}

new XA.Command({
	name: "ping",
	description: "Returns the current Ticks Per Second of the servers ping",
	role: "member",
}).executes(async (ctx) => {
	ctx.reply("§b> §3Понг! Проверка начата...");
	let ticks = await getServerTPS();
	ctx.reply(
		`§b> §3TPS сервера ${
			ticks > 18 ? "§aхороший" : ticks > 13 ? "§gнормальный" : "§cплохой"
		}§f: ${ticks}`
	);
});
