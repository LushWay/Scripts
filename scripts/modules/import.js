// Class for register X-API module
import { m, mm } from "../lib/Module/creator.js";

import { ItemTypes } from "@minecraft/server";
import { wo } from "../lib/Class/Options.js";

m`S_DBview`;
m`S_HelpCommand`;
m`S_FastReload`;
m`Menu`;
m`Region`;
m`test`;
m`Battle Royal`;
m`Server`;
m`Chat`;
m`Modding`;
mm("OnJoin", { fileName: "join" });

if (false) {
	m`Debug`;
	m`GameTest`;
	m`Leaderboards`;
	m`Airdrops`;
	m`Chest GUI/src`;
	if (!wo.QQ("import:cmd:wb:disable"))
		mm("World Edit", {
			fileName: "WORLDindex.js",
		});
	if (ItemTypes.get("addon:akm")) m`Guns`;
	m`migrate`;
}
