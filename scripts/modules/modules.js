// Class for register X-API module
import { Module } from "../lib/Module/creator.js";

import { Items } from "@minecraft/server";
import { wo } from "../lib/Class/XOptions.js";

new Module("fast_reload");
new Module("help");
new Module("Menu");
new Module("test");
new Module("Battle Royal");
new Module("Server");
new Module("Chat");

if (false) {
	new Module("BuildRegion");
	new Module("Lmao");
	new Module("GameTest");
	new Module("Leaderboards");
	new Module("Airdrops");
	new Module("Chest GUI/src");
	if (!wo.QQ("import:cmd:wb:disable"))
		new Module("World Edit", {
			fileName: "WORLDindex.js",
		});
	if (Items.get("addon:akm")) new Module("Guns");
	new Module("migrate");
}
