import { Items } from "@minecraft/server";
import { wo } from "../lib/Class/Options.js";
import { Module } from "../lib/Module/creator.js";

new Module("help");
new Module("Gui");
new Module("test");
new Module("Battle Royal");
new Module("Server");
new Module("BuildRegion");
new Module("Chat");

if (false) {
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
