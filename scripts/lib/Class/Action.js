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
		const location = Vector.string(Vector.floor(player.location));
		if (location in PlaceAction.ACTIONS) {
			PlaceAction.ACTIONS[location](player);
		}
	},
	"PlaceAction",
	10
);

/**
 * @typedef {(player: Player) => boolean} Fn
 */

export class LockAction {
	/** @type {Record<string, LockAction>} */
	static LOCKERS = {};

	/**
	 * Creates new locker that can lock other actions
	 * @param {string} name - Name of LockAction (used in isLocked(ignore))
	 * @param {Fn} fn - Fn that checks if player is locked
	 * @param {string} lockText - Text that returns when player is locked
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
	 * @param {boolean} [o.tell]
	 * @param {boolean} [o.returnText] - Return lock text instead of boolean
	 */
	static locked(player, { ignore, accept, tell, returnText } = {}) {
		for (const key in this.LOCKERS) {
			if (ignore && ignore.includes(key)) continue;
			if (accept && !accept.includes(key)) continue;
			if (this.LOCKERS[key].fn(player)) {
				const { lockText } = this.LOCKERS[key];
				if (tell) player.tell(lockText);
				return returnText ? lockText : true;
			}
		}

		return false;
	}
}
