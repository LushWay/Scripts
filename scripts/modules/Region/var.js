import { DisplayError, XA } from "../../xapi.js";

/**
 * @type {Record<string, number>}
 */
export const InRaid = {};

export function getServerType() {
	const DB = XA.tables.basic;
	const KEY = "server.type";
	const VALUES = {
		0: "build",
		1: "survival",
	};

	function toDefault() {
		DB.set(KEY, 0);
		return 0;
	}

	/** @type {"build" | "survival"} */
	const type = VALUES[DB.get(KEY) ?? toDefault()];

	if (type !== "build" && type !== "survival") {
		toDefault();
		DisplayError(new TypeError("Invalid BASIC::server.type: " + type));
	}

	return type;
}
