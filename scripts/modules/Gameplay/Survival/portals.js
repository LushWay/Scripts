import { Player, Vector } from "@minecraft/server";
import { XA } from "xapi.js";
import { LockAction, PlaceAction } from "../../../lib/Class/Action.js";
import { Minigame } from "../Minigames/Builder.js";

const getSettings = XA.PlayerOptions("Телепорт", "Atp", {
	showCoordinates: {
		desc: "Показывать координаты телепортации (выключите если вы стример)",
		value: true,
		name: "",
	},
	title: { desc: "", value: true, name: "" },
});

/**
 * @typedef {{
 *   ignorePvp?: boolean;
 *   ignoreQuene?: string;
 * }} CustomTeleportOptions
 */

/**
 *
 * @param {Player} player
 * @param {Vector3} to
 * @param {object} [options]
 * @param {string} [options.ignoreQuene]
 */
export function teleport(player, to, options = {}) {
	/** @param {string} reason */
	const fail = (reason) => player.tell("§c► " + reason);

	const quene = Minigame.getQuene(player).name;
	if (quene && quene !== options.ignoreQuene) {
		return fail(
			`Вы не можете телепортироваться, стоя в очереди. Выйти: §f-quit`
		);
	}

	if (LockAction.tellLocked(player, {})) return;

	player.teleport(to);
}

export class Portal {
	/**
	 * Creates new portal.
	 * @param {string} name
	 * @param {Vector3} from
	 * @param {Vector3} to
	 * @param {Vector3} place
	 * @param {object} [o]
	 * @param {string[]} [o.aliases]
	 * @param {boolean} [o.createCommand]
	 * @param {string} [o.commandDescription]
	 */
	constructor(
		name,
		from,
		to,
		place,
		{ aliases = [], createCommand = true, commandDescription } = {}
	) {
		this.from = from;
		this.to = to;
		this.place = place;

		if (createCommand)
			new XA.Command({
				name,
				aliases,
				description: commandDescription ?? `§bТелепорт на ${name}`,
				type: "public",
			}).executes((ctx) => {
				this.teleport(ctx.sender);
			});

		for (const pos of Vector.foreach(from, to))
			new PlaceAction(pos, (p) => this.teleport(p));
	}
	/**
	 * @param {Player} player
	 */
	teleport(player) {
		teleport(player, this.place);
	}
}
