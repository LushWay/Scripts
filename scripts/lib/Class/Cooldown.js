import { Player } from "@minecraft/server";
import { XInstantDatabase } from "../Database/DynamicProperties.js";

export class XCooldown {
	/**
	 *
	 * @param {string} name
	 * @param {string} ID
	 * @returns
	 */
	static genDBkey(name, ID) {
		return "COOLDOWN_" + name + ":" + ID;
	}
	/**
	 * @type {XInstantDatabase}
	 * @private
	 */
	db;
	/**
	 * @type {string}
	 * @private
	 */
	key;
	/**
	 * @type {number}
	 * @private
	 */
	time;
	/**
	 * @type {Player | undefined}
	 */
	player;
	/**
	 * create class for manage player cooldowns
	 * @param {XInstantDatabase} db Database to store cooldowns
	 * @param {string} type Type of the cooldown
	 * @param {string | Player} source id or player that used for generate key and tell messages
	 * @param {number} time Time in ms
	 */
	constructor(db, type, source, time) {
		this.db = db;
		this.key = XCooldown.genDBkey(type, typeof source === "string" ? source : source.id);
		if (typeof source !== "string") this.player = source;
		this.time = time;
	}
	update() {
		this.db.set(this.key, Date.now());
	}
	get statusTime() {
		const data = this.db.get(this.key);
		if (typeof data === "number" && Date.now() - data <= this.time) return Date.now() - data / 1000;
		return "EXPIRED";
	}
	isExpired() {
		const status = this.statusTime;
		if (status === "EXPIRED") return true;
		if (this.player) {
			const time = getRemainingTime(status);
			this.player.tell(`§cПодожди еще §f${time}`);
		}
	}
	expire() {
		this.db.delete(this.key);
	}
}

/**
 *
 * @param {number} ms
 */
function getRemainingTime(ms) {
	const date = new Date();
	date.setTime(ms);

	let time = 0,
		type = "ms";
	["дней", "дня", "день"];
	/**
	 *
	 * @param {number} value
	 * @param {string} valueType
	 */
	const set = (value, valueType) => {
		if (time === 0 && value > 0) {
			time = value;
			type = valueType;
		}
	};

	set(date.getTime() / (1000 * 60 * 60 * 60 * 24), "days");

	"Date: " +
		date.getDate() +
		" " +
		+" " +
		date.getHours() +
		"hh" +
		date.getMinutes() +
		"mm" +
		date.getSeconds() +
		"ss " +
		date.getMilliseconds() +
		"ms";
}

function getT(value) {
	const sv = value.toString();

	let o = "секунд";
	if (sv === 1) {
		o = "секунда";
	} else if (sv == "2" || sv == "3" || sv == "4") {
		o = `секунды`;
	}
	if (sv.endsWith("1") && sv !== "11") {
		o = "секунду";
	}
	return o;
}
