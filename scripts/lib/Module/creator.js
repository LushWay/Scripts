import { __MODULES__ } from "./loader.js";

export class Module {
	/**
	 *
	 * @param {string} folderName
	 * @param {IModuleOptions} [options]
	 */
	constructor(folderName, options = {}) {
		this.folder = folderName;

		this.path = options.folderPath ?? "./modules/";
		this.file = options.fileName ?? "index";

		__MODULES__[this.path + this.folder + "/" + this.file + ".js"] = folderName;
	}
}
