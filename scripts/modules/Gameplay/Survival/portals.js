import { Player } from "@minecraft/server";
import { XA } from "xapi.js";
import { quene } from "../Battle Royal/var.js";

const getSettings = XA.PlayerOptions("Телепорт", "Atp", {
	showCoordinates: {
		desc: "Показывать координаты телепортации (выключите если вы стример)",
		value: true,
		name: "",
	},
	title: { desc: "", value: true, name: "" },
});

/**
 *
 * @param {Player} player
 * @param {Vector3} pos
 */
function tp(player, pos, tpAnimation = true) {
	if (tpAnimation) player.runCommandAsync("effect @s clear");
	let befplace;
	player.teleport(pos);
	player.tell(`${befplace ? befplace : ""}§a◙ §3b`);
}

/**
 *
 * @param {Player} player
 * @param {Vector3} pos
 * @param {{pvp?: boolean; lock?: boolean; quene?: boolean}} [ignore]
 */
export function Atp(player, pos, ignore) {
	const tag = XA.Entity.getTagStartsWith(player, "locktp:");

	/** @param {string} reason */
	const fail = (reason) => player.tell("§c► " + reason);

	if (!ignore?.lock && tag)
		return fail(`Сейчас это запрещено (префикс запрета: ${tag})`);

	if (!ignore?.quene && Object.keys(quene).includes(player.name))
		return fail(
			`Вы не можете телепортироваться, стоя в очереди. Выйти: §f-br quit`
		);

	if (!ignore?.pvp && XA.Entity.getScore(player, "pvp") > 0)
		return fail(`Вы находитесь в режиме PVP!`);

	const settings = getSettings(player);

	tp(player, pos, settings.title);
}

new XA.Command({
	name: "hub",
	aliases: ["spawn", "tp"],
	description: "§bПеремещает на спавн",
	type: "public",
}).executes((ctx) => {
	Atp(ctx.sender, { x: 1, y: 1, z: 1 });
});

new XA.Command({
	name: "minigames",
	aliases: ["mg"],
	description: "§bПеремещает на спавн минигр",
	type: "public",
}).executes((ctx) => {
	Atp(ctx.sender, { x: 1, y: 1, z: 1 });
});

new XA.Command({
	name: "anarchy",
	aliases: ["anarch"],
	description: "§bПеремещает на анархию",
	type: "public",
}).executes((ctx) => {
	Atp(ctx.sender, { x: 1, y: 1, z: 1 });
});
