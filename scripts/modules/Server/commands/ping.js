import { system } from "@minecraft/server";
import { XA } from "../../../xapi.js";

/**
 *
 * @returns {Promise<number>}
 */
async function getServerTPS() {
	let startTime = Date.now();
	let ticks = 0;
	return new Promise((resolve) => {
		let s = system.runSchedule(() => {
			if (Date.now() - startTime < 1000) {
				ticks++;
			} else {
				system.clearRunSchedule(s);
				resolve(ticks);
			}
		});
	});
}

new XA.Command({
	name: "ping",
	description: "Returns the current Ticks Per Second of the servers ping",
}).executes(async (ctx) => {
	let ticks = await getServerTPS();
	ctx.reply(
		`§b> §3TPS сервера: ${ticks > 18 ? "§f{ §aХороший" : ticks > 13 ? "§f{ §eНормальный" : "§f{ §cПлохой"} ${ticks} §f}`
	);
});
