import { Database } from "../../lib/Database/Rubedo.js";
import { DisplayError, XA } from "../../xapi.js";

/**
 * @type {Record<string, number>}
 */
export const InRaid = {};

/**
 * @type {Database<string, number>}
 */
const DB = XA.tables.basic;
/** @type {["build", "survival"]} */
const TYPES = ["build", "survival"];
const KEY = "server.type";

function toDefault() {
	DB.set(KEY, 0);
	return 0;
}

export function getServerType() {
	const type = TYPES[DB.get(KEY) ?? toDefault()];

	if (type !== "build" && type !== "survival") {
		toDefault();
		DisplayError(new TypeError("Invalid BASIC::server.type: " + type));
	}

	return type;
}

