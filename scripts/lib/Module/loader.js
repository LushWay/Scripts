import { ThrowError, __CORE_IMPORT__ } from "xapi.js";
import { CONFIG } from "config.js";
import { MODULES } from "../../modules/modules.js";

/**
 *
 * @param {(file: string) => Promise} importFunction
 * @param {Object<string, string>} arrayOfFiles
 */
export async function multiload(
	importFunction,
	arrayOfFiles,
	type = "sub",
	wait = false
) {
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

			if (wait) await module;
			else module.catch(er);
		} catch (e) {
			er(e);
		}
	}
}

export async function load() {
	return multiload(
		__CORE_IMPORT__,
		Object.fromEntries(
			Object.entries(MODULES).map(([key, value]) => [
				value.path + key + "/" + value.fileName + ".js",
				key,
			])
		),
		"X-API",
		CONFIG.module.loadAwait
	);
}
