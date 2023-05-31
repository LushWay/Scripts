import { util } from "xapi.js";

const modules = [
	"./Server/Server/index.js",
	"./Server/Admin/index.js",
	"./Server/DatabaseView/index.js",
	"./Server/HelpCommand/index.js",
	"./Server/Chat/index.js",
	"./Server/OnJoin/join.js",
	"./Server/Menu/index.js",
	"./Server/Leaderboards/index.js",

	/**
	 * Gameplay modules
	 */
	"./Gameplay/Indicator/index.js",

	/**
	 * Development modules:
	 */
	"./Development/GameTest/index.js",
	"./Development/Test/index.js",
	"./Development/World Edit/WBindex.js",

	"./Server/Objectives/index.js",
];

export async function loadModules() {
	for (const module of modules) {
		try {
			await import(module);
		} catch (e) {
			util.error(e, { errorName: "ModuleError" });
		}
	}
}
