import { CONFIG } from "config.js";
import { DIR_IMPORT, ThrowError } from "xapi.js";

/**
 * @type {Object<string, string>}
 */
export const __MODULES__ = {};

/**
 *
 * @param {(file: string) => Promise} importFunction
 * @param {Object<string, string>} arrayOfFiles
 */
export async function multiload(importFunction, arrayOfFiles, type = "sub") {
	for (const [path, name] of Object.entries(arrayOfFiles)) {
		const er = (e) =>
			ThrowError({
				message: `§c${name}: §f${`${e.message ?? e}`.replace(
					// Get "Module (>>modules/ex/index.js:12<<)" part
					/([\w\/]+\.js:?\s?)/,
					"§6$1§f"
				)}`,
				stack: e.stack,
				name: type,
			});
		try {
			const module = importFunction(path);

			if (CONFIG.module.loadAwait) await module;
			else module.catch(er);
		} catch (e) {
			er(e);
		}
	}
}

export async function load() {
	return multiload(DIR_IMPORT, __MODULES__, "X-API");
}
