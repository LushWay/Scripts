/**
 *
 * @template b
 * @param {b} prototype
 * @param {Partial<b>} object
 * @returns {b}
 */
export function OverTakes(prototype, object) {
	const prototypeOrigin = Object.setPrototypeOf(
		Object.defineProperties({}, Object.getOwnPropertyDescriptors(prototype)),
		Object.getPrototypeOf(prototype)
	);
	Object.setPrototypeOf(object, prototypeOrigin);
	Object.defineProperties(prototype, Object.getOwnPropertyDescriptors(object));
	return prototypeOrigin;
}

import "./Extensions/dimension.js";
import "./Extensions/enviroment.js";
import "./Extensions/itemstack.js";
import "./Extensions/player.js";
import "./Extensions/system.js";
import "./Extensions/vector.js";
import "./Extensions/world.js";
