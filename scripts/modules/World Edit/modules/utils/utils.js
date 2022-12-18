import { BlockLocation, MinecraftBlockTypes } from "@minecraft/server";
import { DIMENSIONS } from "../../../../lib/List/dimensions.js";
import { ThrowError, XA } from "../../../../xapi.js";

/**
 *
 * @param {string} blockTypeID
 * @param {BlockLocation} location
 * @returns
 */
export function setblock(blockTypeID, location) {
	if (blockTypeID.includes(".") || blockTypeID === "air") {
		// Block is written like "stone.3", so we need to get data and id
		const [_, id, data] = /^(.+)\.(\d+)/g.exec(blockTypeID);
		XA.runCommandX(`setblock ${location.x} ${location.y} ${location.z} ${id} ${data}`, { showError: true });
	} else {
		// Normal block type
		const blockType = MinecraftBlockTypes.get(`minecraft:${blockTypeID}`);
		if (!blockType) return ThrowError(new TypeError(`BlockType ${blockTypeID} does not exist!`));
		DIMENSIONS.overworld.getBlock(location).setType(blockType);
	}
}

/**
 *
 * @param {number} ms
 * @returns
 */
export function get(ms) {
	let parsedTime = "0";
	let type = "ошибок";

	/**
	 * @param {number} value
	 * @param {[string, string, string]} valueType 1 секунда 2 секунды 5 секунд
	 */
	const set = (value, valueType, fiction = 0) => {
		if (parsedTime === "0" && ~~value > 1 && value < 100) {
			// Replace all 234.0 values to 234
			parsedTime = value
				.toFixed(fiction)
				.replace(/(\.[1-9]*)0+$/m, "$1")
				.replace(/\.$/m, "");

			type = XA.Cooldown.getT(parsedTime, valueType);
		}
	};

	set(ms / (1000 * 60), ["минуту", "минуты", "минут"], 2);
	set(ms / 1000, ["секунду", "секунды", "секунд"], 1);
	set(ms, ["миллисекунду", "миллисекунды", "миллисекунд"], 1);

	return { parsedTime, type };
}
