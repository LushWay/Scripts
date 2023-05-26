import { Player, Vector, system } from "@minecraft/server";

export class PlaceAction {
	/** @type {Record<string, (player: Player) => void>} */
	static ACTIONS = {};
	/**
	 * Creates action that triggers function when any player gets this place.
	 * @param {Vector3} place
	 * @param {(player: Player) => void} action
	 */
	constructor(place, action) {
		PlaceAction.ACTIONS[Vector.string(place)] = action;
	}
}

system.runPlayerInterval(
	(player) => {
		const location = Vector.string(player.location);
		if (location in PlaceAction.ACTIONS) {
			PlaceAction.ACTIONS[location](player);
		}
	},
	"PlaceAction",
	0
);

/**
 * @typedef {(player: Player) => boolean} Fn
 */

export class LockAction {
	/** @type {Record<string, LockAction>} */
	static LOCKERS = {};

	/**
	 * Creates new blocker that can block other actions
	 * @param {string} name - Name of BlockerAction (used in isBlocked(ignore))
	 * @param {Fn} fn - Fn that checks if player is blocked
	 * @param {string} lockText - Text that returns when player is blocked
	 */
	constructor(name, fn, lockText) {
		this.fn = fn;
		this.lockText = lockText;

		LockAction.LOCKERS[name] = this;
	}

	/**
	 * Checks if player is locked by any LockerAction and returns first lockText from it
	 * @param {Player} player - Player to check
	 * @param {object} o
	 * @param {string[]} [o.ignore] - Which LockerActions ignore
	 * @param {string[]} [o.accept] - Which LockerActions only accept
	 */
	static getLocked(player, { ignore, accept }) {
		for (const key in this.LOCKERS) {
			if (ignore && ignore.includes(key)) continue;
			if (accept && !accept.includes(key)) continue;
			if (this.LOCKERS[key].fn(player)) return this.LOCKERS[key].lockText;
		}
	}
	/** @type {(...args: Parameters<typeof LockAction["getLocked"]>) => boolean} */
	static tellLocked(player, options) {
		const lock = this.getLocked(player, options);
		if (typeof lock === "string") {
			player.tell(lock);
			return true;
		}

		return false;
	}
}
