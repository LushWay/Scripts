import { DisplayError } from "xapi.js";

/**
 *
 * @param {Error} e
 * @param {string} name
 */
export function CatchLoadError(e, name) {
	DisplayError({
		message: `§c${name}: §f${`${e.message ?? e}`.replace(
			// Get "Module (>>modules/ex/index.js:12<<)" part
			/([\w\s\/]+\.js:?\s?)/,
			"§6$1§f"
		)}`,
		stack: e.stack,
		name: "LoadError",
	});
}

export async function LoadModules() {
	try {
		await import("../../modules/import.js");
	} catch (e) {
		CatchLoadError(e, "X-API Module");
	}
}
