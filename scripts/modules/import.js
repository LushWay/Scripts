import "./Server/Admin/index.js";
import "./Server/Chat/index.js";
import "./Server/DatabaseView/index.js";
import "./Server/HelpCommand/index.js";
import "./Server/Menu/index.js";
import "./Server/OnJoin/join.js";
import "./Server/Server/index.js";

/**
 * Gameplay modules
 */
import "./Gameplay/Indicator/index.js";
import "./Gameplay/Loot/loot.js";
import "./Server/Leaderboards/index.js";
/**
 * Development modules:
 */
import "./Development/GameTest/index.js";
import "./Development/Test/index.js";
import "./Server/Objectives/index.js";

/**
 * Lazy loading to not cause script spike
 */
import { system } from "@minecraft/server";
import { util } from "../xapi.js";
system.runTimeout(
	async () => {
		try {
			await import("./Development/WorldEdit/WBindex.js");
		} catch (e) {
			util.error(e);
		}
	},
	"wb",
	40
);
