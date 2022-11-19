/**
 *
 * @param {IModuleOptions} options
 */
export function m(options) {
	/** @type {IModuleOptions} */
	const data = {
		path: options.path ?? "./modules/",
		fileName: options.fileName ?? "index",
		condition: options.condition ?? true,
		dependencies: options.dependencies ?? [],
	};

	return data;
}

export class Module {
	/**
	 *
	 * @param {string} folderName
	 * @param {IModuleOptions} [options]
	 */
	constructor(folderName, options = {}) {
		this.folder = folderName;

		this.path = options.path ?? "./modules/";
		this.file = options.fileName ?? "index";
		this.condition = options.condition ?? true;

		if (this.condition) false;
	}
}
