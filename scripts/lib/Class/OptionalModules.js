export const Module = {
	/**
	 * Module not avaible on common worlds, so using boilerplate
	 * @type {typeof import("@minecraft/server-admin") | false}
	 */
	ServerAdmin: false,
	/**
	 * Module not avaible on common worlds, so using boilerplate
	 * @type {typeof import("@minecraft/server-net") | false}
	 */
	ServerNet: false,
};

dynamicImport("@minecraft/server-admin", "ServerAdmin");
dynamicImport("@minecraft/server-net", "ServerNet");

/**
 * @param {string} module
 * @param {keyof typeof Module} key
 */
function dynamicImport(module, key) {
	import(module)
		.then((MODULE) => {
			Module[key] = MODULE;
		})
		.catch((e) => console.warn(`§eDisabled§r: ${module}, ${e}`));
}
