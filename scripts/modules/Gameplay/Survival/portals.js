import { Player, Vector } from "@minecraft/server";
import { LockAction, PlaceAction } from "xapi.js";
import { Minigame } from "../Minigames/Builder.js";

/**
 * @typedef {Object} TeleportOptions
 * @prop {string} [ignoreQueneName]
 */

export class Portal {
	/**
	 *
	 * @param {Player} player
	 * @param {TeleportOptions} [options]
	 */
	static canTeleport(player, options = {}) {
		/** @param {string} reason */
		const fail = (reason) => {
			player.tell("§c► " + reason);
			return false;
		};

		const quene = Minigame.getQuene(player)?.name;
		if (quene && quene !== options.ignoreQueneName) {
			return fail(
				`Вы не можете телепортироваться, стоя в очереди. Выйти: §f-quit`
			);
		}

		if (LockAction.locked(player, {})) return false;

		return true;
	}
	/**
	 *
	 * @param {Player} player
	 * @param {Vector3} to
	 * @param {TeleportOptions} [options]
	 */
	static teleport(player, to, options = {}) {
		if (this.canTeleport(player, options)) player.teleport(to);
	}
	/**
	 * Creates new portal.
	 * @param {string} name
	 * @param {Vector3 | null} from
	 * @param {Vector3 | null} to
	 * @param {Vector3 | ((player: Player) => void)} place
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
		if (typeof place === "function") {
			this.teleport = place;
		} else this.place = place;

		if (createCommand)
			new XCommand({
				name,
				aliases,
				description: commandDescription ?? `§bТелепорт на ${name}`,
				type: "public",
			}).executes((ctx) => {
				this.teleport(ctx.sender);
			});

		if (from && to) {
			for (const pos of Vector.foreach(from, to)) {
				new PlaceAction(pos, (p) => this.teleport(p));
			}
		}
	}
	/**
	 * @param {Player} player
	 */
	teleport(player) {
		Portal.teleport(player, this.place);
	}
}
