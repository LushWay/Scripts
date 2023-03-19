/**
 *
 * @param {(file: string) => Promise} importFunction
 * @param {[string, string][]} arrayOfFiles
 * @example ```js
 * multiload((file) => import("./" + file + ".js"), [["filePath", "Name"]], "ModuleName")
 * ```
 */
export function multiload(importFunction: (file: string) => Promise<any>, arrayOfFiles: [string, string][], type?: string): Promise<void>;
export function load_modules(): Promise<void>;
/**
 * @type {Object<string, string>}
 */
export const __MODULES__: {
    [x: string]: string;
};
