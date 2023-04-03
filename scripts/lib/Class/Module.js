import { CONFIG } from "config.js";
import { DisplayError } from "xapi.js";

/**
 * @type {Object<string, string>}
 */
globalThis.__MODULES__ = {};

/**
 *
 * @param {(file: string) => Promise<any>} importFunction
 * @param {[string, string][]} arrayOfFiles
 * @example ```js
 * multiload((file) => import("./" + file + ".js"), [["filePath", "Name"]], "ModuleName")
 * ```
 */
export async function multiload(importFunction, arrayOfFiles, type = "sub") {
	for (const [path, name] of arrayOfFiles) {
		const error = (/** @type {Error} */ e) =>
			DisplayError({
				message: `§c${name}: §f${`${e.message ?? e}`.replace(
					// Get "Module (>>modules/ex/index.js:12<<)" part
					/([\w\s\/]+\.js:?\s?)/,
					"§6$1§f"
				)}`,
				stack: e.stack,
				name: type,
			});
		try {
			const module = importFunction(path);

			if (CONFIG.module.loadAwait) await module;
			else module.catch(error);
		} catch (e) {
			error(e);
		}
	}
}

export async function load_modules() {
	await import("../../modules/import.js");
	return multiload(DIR_IMPORT, Object.entries(__MODULES__), "X-API");
}

/**
 * @typedef {{
 *   folderPath?: string;
 *   fileName?: string;
 * }} IModuleOptions
 */

/**
 *
 * @param {string} folderName
 * @param {IModuleOptions} [options]
 */
function Module(folderName, options = {}) {
	const folder = folderName;

	const path = options.folderPath ?? "./modules/";
	const file = options.fileName ?? "index";

	__MODULES__[path + folder + "/" + file + ".js"] = folderName;
}

/**
 * It takes a module name, and registers a it as new module
 * @param {TemplateStringsArray} name - The name of the module.
 */
export const m = (name) => Module(name[0]);
/**
 * It creates a new module with the given name and options
 * @param {string} name - The name of the module.
 * @param {IModuleOptions} options - Options of module
 */
export const mm = (name, options) => Module(name, options);

/**
 * Loads module with name from path
 * @param {string} path
 * @param {string} name
 */
export const path = (path, name) => (__MODULES__[path] = name);
