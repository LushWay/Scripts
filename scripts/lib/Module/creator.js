import "./loader.js";

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

