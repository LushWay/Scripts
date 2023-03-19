import { CONFIG } from "config.js";
import { DIR_IMPORT, DisplayError } from "xapi.js";
/**
 * @type {Object<string, string>}
 */
export const __MODULES__ = {};
/**
 *
 * @param {(file: string) => Promise} importFunction
 * @param {[string, string][]} arrayOfFiles
 * @example ```js
 * multiload((file) => import("./" + file + ".js"), [["filePath", "Name"]], "ModuleName")
 * ```
 */
export async function multiload(importFunction, arrayOfFiles, type = "sub") {
    for (const [path, name] of arrayOfFiles) {
        const er = (e) => DisplayError({
            message: `§c${name}: §f${`${e.message ?? e}`.replace(
            // Get "Module (>>modules/ex/index.js:12<<)" part
            /([\w\s\/]+\.js:?\s?)/, "§6$1§f")}`,
            stack: e.stack,
            name: type,
        });
        try {
            const module = importFunction(path);
            if (CONFIG.module.loadAwait)
                await module;
            else
                module.catch(er);
        }
        catch (e) {
            er(e);
        }
    }
}
export async function load_modules() {
    return multiload(DIR_IMPORT, Object.entries(__MODULES__), "X-API");
}
