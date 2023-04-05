import { DisplayError } from "../xapi.js";

const modules = [
	"./Server/index.js",

	"./Admin/index.js",

	"./DatabaseView/index.js",

	"./HelpCommand/index.js",

	"./Chat/index.js",

	"./OnJoin/join.js",

	"./Menu/index.js",

	/**
	 * Gameplay modules
	 */
	"./Enchantments/index.js",
	"./Indicator/index.js",
	// "./BattleRoyal/index.js",
	// "./Airdrops/index.js",

	/**
	 * Development modules:
	 */
	"./GameTest/index.js",
	"./Test/index.js",
	"./Leaderboards/index.js",
	// "./World Edit/WBindex.js",

	"./Objectives/index.js",
];

export async function loadModules() {
	for (const module of modules) {
		try {
			await import(module);
		} catch (e) {
			DisplayError(e, { errorName: "ModuleError" });
		}
	}
}
